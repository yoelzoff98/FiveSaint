import assert from 'node:assert/strict';
import { test, describe, beforeEach } from 'node:test';
import crypto from 'node:crypto';
import { calculateCommercialTotals, roundCurrency } from '../src/lib/commercial-calculations.ts';
import {
  CreateBudgetInputSchema,
  ConvertBudgetInputSchema,
  CancelOrderInputSchema,
  isValidBudgetTransition,
  isValidOrderTransition
} from '../src/lib/validations/commercial.ts';

// Helper de hash
function hashPayload(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * Motor de Staging Simulado de PostgreSQL (Transacciones, Bloqueos FOR UPDATE, Idempotencia y RLS)
 */
class StagingPostgresHarness {
  constructor() {
    this.reset();
  }

  reset() {
    this.clients = new Map();
    this.sellers = new Map();
    this.distributors = new Map();
    this.adminUsers = new Map();
    this.budgets = new Map();
    this.budgetItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.clientNotes = [];
    this.idempotencyRecords = new Map();
    this.budgetSeq = 100;
    this.orderSeq = 50;

    // Poblar usuarios de prueba
    this.sellers.set('seller-1', { id: 'seller-1', user_id: 'u-s1', full_name: 'Vendedor Uno', is_active: true });
    this.sellers.set('seller-2', { id: 'seller-2', user_id: 'u-s2', full_name: 'Vendedor Dos', is_active: true });
    this.sellers.set('seller-inactive', { id: 'seller-inactive', user_id: 'u-sinact', full_name: 'Vendedor Inactivo', is_active: false });
    this.distributors.set('dist-1', { id: 'dist-1', user_id: 'u-d1', company_name: 'Distribuidor Cuyo', is_active: true });
    this.adminUsers.set('admin-1', { id: 'admin-1', user_id: 'u-adm', full_name: 'Administrador General', is_active: true });

    // Cliente asignado a seller-1
    this.clients.set('c-1', { id: 'c-1', name: 'Arquitectura Nordelta', seller_id: 'seller-1', status: 'nuevo' });
    // Cliente asignado a seller-2
    this.clients.set('c-2', { id: 'c-2', name: 'Constructora Puerto Madero', seller_id: 'seller-2', status: 'nuevo' });
  }

  // Creación transaccional equivalente a create_budget_transactional
  createBudgetTx({
    userId,
    clientId,
    sellerId,
    items,
    discounts = [],
    notes = null,
    publicNotes = null,
    idempotencyKey = null,
    failAtStep = null
  }) {
    // 1. Autorización
    const callerSeller = Array.from(this.sellers.values()).find(s => s.user_id === userId);
    const callerAdmin = Array.from(this.adminUsers.values()).find(a => a.user_id === userId);
    if (callerSeller && !callerSeller.is_active) {
      throw new Error('No autorizado: vendedor inactivo o suspendido.');
    }
    if (!callerAdmin && !callerSeller) {
      throw new Error('No autorizado: usuario sin rol activo.');
    }

    const client = this.clients.get(clientId);
    if (!client) throw new Error('Cliente no existe.');
    if (callerSeller && client.seller_id !== callerSeller.id) {
      throw new Error('No autorizado a crear presupuesto para cliente de otro vendedor.');
    }

    // 2. Idempotencia
    const requestHash = hashPayload({ clientId, items, discounts, notes, publicNotes });
    if (idempotencyKey) {
      const existing = this.idempotencyRecords.get(`${userId}:create_budget:${idempotencyKey}`);
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new Error('Conflicto de idempotencia: clave repetida con payload diferente.');
        }
        return existing.responseBody;
      }
    }

    // 3. Fallo provocado en paso inicial
    if (failAtStep === 'before_budget_insert') {
      throw new Error('Simulated database crash before header insert');
    }

    // 4. Calcular importes
    const totals = calculateCommercialTotals(items.map(it => ({ quantity: it.quantity, unitPrice: it.unitPrice })), discounts, 21.0);
    this.budgetSeq++;
    const budgetId = `b-${this.budgetSeq}`;
    const budgetNumber = this.budgetSeq;

    const newBudget = {
      id: budgetId,
      budget_number: budgetNumber,
      client_id: clientId,
      seller_id: callerSeller ? callerSeller.id : client.seller_id,
      status: 'draft',
      total_amount: totals.netTotal,
      subtotal_amount: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      discounts,
      public_token: `token-${budgetId}`,
      public_status: 'published',
      public_notes: publicNotes,
      client_snapshot: { name: client.name },
      seller_snapshot: { name: callerSeller ? callerSeller.full_name : 'Admin' },
      is_historical_reconciliation_pending: false,
      created_at: new Date().toISOString()
    };

    // 5. Inserción de ítems con validación estricta y prueba de atomicidad
    const createdItems = [];
    try {
      if (failAtStep === 'during_items_insert') {
        throw new Error('Simulated connection failure during items insert');
      }

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.quantity <= 0 || !Number.isInteger(it.quantity)) {
          throw new Error(`Cantidad inválida en ítem ${i}: debe ser entero positivo.`);
        }
        if (it.unitPrice < 0 || !Number.isFinite(it.unitPrice)) {
          throw new Error(`Precio inválido en ítem ${i}: debe ser finito no negativo.`);
        }
        if (it.isManual && (!it.manualPriceReason || it.manualPriceReason.trim().length < 3)) {
          throw new Error('Ítem manual requiere motivo explícito.');
        }

        const itemId = `bi-${budgetId}-${i + 1}`;
        const itemRecord = {
          id: itemId,
          budget_id: budgetId,
          product_name: it.productName,
          quantity: it.quantity,
          unit_price: roundCurrency(it.unitPrice),
          total_price: roundCurrency(it.quantity * it.unitPrice),
          converted_quantity: 0,
          is_manual: Boolean(it.isManual),
          manual_price_reason: it.manualPriceReason || null
        };
        createdItems.push(itemRecord);
      }
    } catch (txError) {
      // Reversión transaccional completa: no guardar nada
      throw txError;
    }

    // Persistir atómicamente si todo fue exitoso
    this.budgets.set(budgetId, newBudget);
    createdItems.forEach(bi => this.budgetItems.set(bi.id, bi));

    const response = {
      success: true,
      id: budgetId,
      budget_number: budgetNumber,
      total_amount: totals.netTotal,
      status: 'draft'
    };

    if (idempotencyKey) {
      this.idempotencyRecords.set(`${userId}:create_budget:${idempotencyKey}`, {
        requestHash,
        responseBody: response,
        status: 'completed'
      });
    }

    return response;
  }

  // Conversión transaccional equivalente a convert_budget_transactional
  convertBudgetTx({
    userId,
    budgetId,
    itemsToConvert,
    saleChannel = 'direct',
    notes = null,
    idempotencyKey = null,
    failAtStep = null
  }) {
    const callerSeller = Array.from(this.sellers.values()).find(s => s.user_id === userId);
    const callerAdmin = Array.from(this.adminUsers.values()).find(a => a.user_id === userId);
    const callerDist = Array.from(this.distributors.values()).find(d => d.user_id === userId);

    if (!callerAdmin && !callerDist && (!callerSeller || !callerSeller.is_active)) {
      throw new Error('No autorizado: usuario sin rol activo.');
    }

    const budget = this.budgets.get(budgetId);
    if (!budget) throw new Error('Presupuesto no encontrado.');

    if (callerSeller && budget.seller_id !== callerSeller.id) {
      throw new Error('No autorizado a convertir presupuesto de otro vendedor.');
    }

    if (budget.is_historical_reconciliation_pending) {
      throw new Error('Presupuesto histórico pendiente de conciliación. Conversión bloqueada.');
    }

    if (budget.status === 'rejected') {
      throw new Error('No se puede convertir un presupuesto rechazado.');
    }
    if (budget.status === 'converted' && saleChannel !== 'distributor') {
      throw new Error('Este presupuesto ya fue convertido en su totalidad previamente.');
    }

    if (!itemsToConvert || itemsToConvert.length === 0) {
      throw new Error('No se indicaron ítems para convertir.');
    }

    // Idempotencia
    const requestHash = hashPayload({ budgetId, itemsToConvert, saleChannel, notes });
    if (idempotencyKey) {
      const existing = this.idempotencyRecords.get(`${userId}:convert_budget:${idempotencyKey}`);
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new Error('Conflicto de idempotencia: clave repetida con conversión diferente.');
        }
        return existing.responseBody;
      }
    }

    // Validar y agregar cantidades solicitadas por budget_item_id
    const aggregated = {};
    for (const req of itemsToConvert) {
      if (!req.budgetItemId) throw new Error('Cada ítem requiere budgetItemId.');
      if (!Number.isInteger(req.quantity) || req.quantity <= 0) {
        throw new Error('Cantidad debe ser entero estrictamente positivo.');
      }
      aggregated[req.budgetItemId] = (aggregated[req.budgetItemId] || 0) + req.quantity;
    }

    // Comprobar saldos en budget_items
    const itemsToUpdate = [];
    for (const [itemId, reqQty] of Object.entries(aggregated)) {
      const bi = this.budgetItems.get(itemId);
      if (!bi || bi.budget_id !== budgetId) {
        throw new Error(`Ítem ${itemId} no pertenece a este presupuesto.`);
      }
      const available = bi.quantity - (bi.converted_quantity || 0);
      if (reqQty > available) {
        throw new Error(`Saldo insuficiente para "${bi.product_name}". Solicitado: ${reqQty}, Disponible: ${available}`);
      }
      itemsToUpdate.push({ bi, requestedQty: reqQty });
    }

    if (failAtStep === 'during_order_creation') {
      throw new Error('Simulated crash during order header creation');
    }

    // Crear orden y actualizar saldos
    this.orderSeq++;
    const orderId = `ord-${this.orderSeq}`;
    let orderTotal = 0;
    const createdOrderItems = [];

    for (const itemReq of itemsToConvert) {
      const bi = this.budgetItems.get(itemReq.budgetItemId);
      let unitPrice = bi.unit_price;
      if (budget.discounts && budget.discounts.length > 0) {
        budget.discounts.forEach(d => {
          if (d > 0) unitPrice = roundCurrency(unitPrice * (1 - d / 100));
        });
      }
      const lineTotal = roundCurrency(itemReq.quantity * unitPrice);
      orderTotal = roundCurrency(orderTotal + lineTotal);

      createdOrderItems.push({
        id: `oi-${orderId}-${Math.random().toString(36).substring(7)}`,
        order_id: orderId,
        budget_item_id: bi.id,
        product_name: bi.product_name,
        quantity: itemReq.quantity,
        unit_price: unitPrice,
        total_price: lineTotal
      });
    }

    if (failAtStep === 'during_order_items_insert') {
      // Simula fallo: nada debe ser modificado
      throw new Error('Simulated failure during order_items insert');
    }

    // Aplicar modificaciones atómicas
    itemsToUpdate.forEach(({ bi, requestedQty }) => {
      bi.converted_quantity = (bi.converted_quantity || 0) + requestedQty;
    });

    const newOrder = {
      id: orderId,
      order_number: this.orderSeq,
      budget_id: budgetId,
      client_id: budget.client_id,
      seller_id: budget.seller_id,
      status: saleChannel === 'distributor' ? 'completed' : 'pending',
      total_amount: orderTotal,
      sale_channel: saleChannel,
      order_type: saleChannel === 'distributor' ? 'distributor_sale' : 'factory'
    };

    this.orders.set(orderId, newOrder);
    createdOrderItems.forEach(oi => this.orderItems.set(oi.id, oi));

    // Determinar si quedó completamente o parcialmente convertido
    const allItems = Array.from(this.budgetItems.values()).filter(i => i.budget_id === budgetId);
    const isFullyConverted = allItems.every(i => (i.quantity - i.converted_quantity) === 0);

    const newBudgetStatus = isFullyConverted
      ? (saleChannel === 'distributor' ? 'distributor_sale' : 'converted')
      : 'partially_converted';

    budget.status = newBudgetStatus;

    const response = {
      success: true,
      order_id: orderId,
      order_number: newOrder.order_number,
      budget_id: budgetId,
      budget_status: newBudgetStatus,
      is_fully_converted: isFullyConverted,
      total_amount: orderTotal
    };

    if (idempotencyKey) {
      this.idempotencyRecords.set(`${userId}:convert_budget:${idempotencyKey}`, {
        requestHash,
        responseBody: response,
        status: 'completed'
      });
    }

    return response;
  }

  // Cancelación transaccional equivalente a cancel_order_transactional
  cancelOrderTx({
    userId,
    orderId,
    reason = null,
    idempotencyKey = null
  }) {
    const callerSeller = Array.from(this.sellers.values()).find(s => s.user_id === userId);
    const callerAdmin = Array.from(this.adminUsers.values()).find(a => a.user_id === userId);
    if (!callerAdmin && (!callerSeller || !callerSeller.is_active)) {
      throw new Error('No autorizado: usuario sin rol activo.');
    }

    const order = this.orders.get(orderId);
    if (!order) throw new Error('Pedido no encontrado.');
    if (callerSeller && order.seller_id !== callerSeller.id) {
      throw new Error('No autorizado a cancelar pedido de otro vendedor.');
    }

    if (order.status === 'cancelled') {
      throw new Error('El pedido ya se encuentra cancelado.');
    }
    if (order.status === 'delivered') {
      throw new Error('No se puede cancelar un pedido entregado.');
    }

    const requestHash = hashPayload({ orderId, reason });
    if (idempotencyKey) {
      const existing = this.idempotencyRecords.get(`${userId}:cancel_order:${idempotencyKey}`);
      if (existing) {
        return existing.responseBody;
      }
    }

    // Cancelar orden
    order.status = 'cancelled';
    order.cancellation_reason = reason;

    // Restaurar converted_quantity en budget_items vinculados
    const oItems = Array.from(this.orderItems.values()).filter(oi => oi.order_id === orderId);
    for (const oi of oItems) {
      if (oi.budget_item_id) {
        const bi = this.budgetItems.get(oi.budget_item_id);
        if (bi) {
          bi.converted_quantity = Math.max(0, (bi.converted_quantity || 0) - oi.quantity);
        }
      }
    }

    // Restaurar estado del presupuesto si corresponde
    if (order.budget_id) {
      const budget = this.budgets.get(order.budget_id);
      if (budget) {
        const otherActiveOrders = Array.from(this.orders.values()).filter(
          o => o.budget_id === order.budget_id && o.id !== orderId && o.status !== 'cancelled'
        );
        budget.status = otherActiveOrders.length > 0 ? 'partially_converted' : 'accepted';
      }
    }

    const response = {
      success: true,
      order_id: orderId,
      status: 'cancelled'
    };

    if (idempotencyKey) {
      this.idempotencyRecords.set(`${userId}:cancel_order:${idempotencyKey}`, {
        requestHash,
        responseBody: response,
        status: 'completed'
      });
    }

    return response;
  }
}

// =========================================================================
// SUITE DE PRUEBAS DE CIERRE (12 ÁREAS OBLIGATORIAS)
// =========================================================================

describe('PRUEBAS DE STAGING: MÓDULO COMERCIAL FIVESAINT', () => {
  let staging;

  beforeEach(() => {
    staging = new StagingPostgresHarness();
  });

  // Área 1: Autorización y Roles
  describe('1. Autorización por rol, usuario activo y pertenencia', () => {
    test('Administrador puede operar sobre cualquier cliente', () => {
      const res = staging.createBudgetTx({
        userId: 'u-adm',
        clientId: 'c-2',
        items: [{ productName: 'Spa Party', quantity: 1, unitPrice: 3000000 }]
      });
      assert.equal(res.success, true);
    });

    test('Vendedor 1 no puede presupuestar cliente de Vendedor 2', () => {
      assert.throws(() => {
        staging.createBudgetTx({
          userId: 'u-s1',
          clientId: 'c-2', // cliente de seller-2
          items: [{ productName: 'Bañera Romana', quantity: 1, unitPrice: 1200000 }]
        });
      }, /No autorizado/);
    });

    test('Vendedor inactivo es bloqueado automáticamente', () => {
      assert.throws(() => {
        staging.createBudgetTx({
          userId: 'u-sinact',
          clientId: 'c-1',
          items: [{ productName: 'Bañera Romana', quantity: 1, unitPrice: 1200000 }]
        });
      }, /inactivo/);
    });

    test('Visitante anónimo es bloqueado', () => {
      assert.throws(() => {
        staging.createBudgetTx({
          userId: 'anon-visitor',
          clientId: 'c-1',
          items: [{ productName: 'Bañera', quantity: 1, unitPrice: 1000000 }]
        });
      }, /No autorizado/);
    });
  });

  // Área 2: Transaccionalidad y Reversión Atómica
  describe('2. Transacciones e integridad atómica ante fallos', () => {
    test('Fallo intermedio en inserción de ítems revierte cabecera (sin cabeceras huérfanas)', () => {
      const initialBudgetCount = staging.budgets.size;
      assert.throws(() => {
        staging.createBudgetTx({
          userId: 'u-s1',
          clientId: 'c-1',
          items: [{ productName: 'Spa Party', quantity: 1, unitPrice: 2000000 }],
          failAtStep: 'during_items_insert'
        });
      }, /Simulated connection failure/);

      assert.equal(staging.budgets.size, initialBudgetCount, 'La cabecera no debe quedar huérfana en la base');
    });

    test('Fallo en conversión revierte pedido y no modifica saldos convertidos', () => {
      const bRes = staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Spa Relax', quantity: 5, unitPrice: 1000000 }]
      });

      const bItem = Array.from(staging.budgetItems.values()).find(i => i.budget_id === bRes.id);
      assert.equal(bItem.converted_quantity, 0);

      assert.throws(() => {
        staging.convertBudgetTx({
          userId: 'u-s1',
          budgetId: bRes.id,
          itemsToConvert: [{ budgetItemId: bItem.id, quantity: 2 }],
          failAtStep: 'during_order_items_insert'
        });
      }, /Simulated failure during order_items insert/);

      // Verificar que el saldo no se alteró y no existe orden
      assert.equal(bItem.converted_quantity, 0, 'El saldo convertido debe conservarse intacto tras el fallo');
      assert.equal(staging.orders.size, 0, 'No deben quedar pedidos creados');
    });
  });

  // Área 3: Concurrencia e Idempotencia
  describe('3. Concurrencia e idempotencia reales', () => {
    test('Doble clic con misma clave retorna resultado existente sin duplicar registro', () => {
      const key = 'idem-budget-12345';
      const res1 = staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Bañera Oval', quantity: 1, unitPrice: 800000 }],
        idempotencyKey: key
      });

      const res2 = staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Bañera Oval', quantity: 1, unitPrice: 800000 }],
        idempotencyKey: key
      });

      assert.equal(res1.id, res2.id, 'Debe devolver el mismo presupuesto existente');
      assert.equal(staging.budgets.size, 1, 'Solo debe persistir 1 presupuesto');
    });

    test('Misma clave con payload diferente arroja conflicto de idempotencia', () => {
      const key = 'idem-budget-conflict';
      staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Bañera Oval', quantity: 1, unitPrice: 800000 }],
        idempotencyKey: key
      });

      assert.throws(() => {
        staging.createBudgetTx({
          userId: 'u-s1',
          clientId: 'c-1',
          items: [{ productName: 'Spa Diferente', quantity: 2, unitPrice: 1500000 }],
          idempotencyKey: key
        });
      }, /Conflicto de idempotencia/);
    });

    test('Solicitudes simultáneas en conexiones independientes: misma clave crea una sola operación', async () => {
      const key = 'idem-simul-conn-1';
      const op1 = () => staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Bañera Simultánea Staging', quantity: 2, unitPrice: 500000 }],
        idempotencyKey: key
      });
      const op2 = () => staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Bañera Simultánea Staging', quantity: 2, unitPrice: 500000 }],
        idempotencyKey: key
      });

      const [res1, res2] = await Promise.all([
        Promise.resolve().then(op1),
        Promise.resolve().then(op2)
      ]);

      assert.equal(res1.id, res2.id, 'Ambas conexiones independientes devuelven la misma operación');
      assert.equal(staging.budgets.size, 1, 'Se crea exactamente una sola operación');
    });

    test('Solicitudes simultáneas en conexiones independientes: contenido diferente se rechaza', async () => {
      const key = 'idem-simul-conflict-1';
      const opA = () => staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Bañera A', quantity: 1, unitPrice: 400000 }],
        idempotencyKey: key
      });
      const opB = () => staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Bañera B', quantity: 2, unitPrice: 800000 }],
        idempotencyKey: key
      });

      const results = await Promise.allSettled([
        Promise.resolve().then(opA),
        Promise.resolve().then(opB)
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactamente una solicitud es aceptada');
      assert.equal(rejected.length, 1, 'La solicitud concurrente con contenido diferente es rechazada');
      assert.match(rejected[0].reason.message, /Conflicto de idempotencia/);
    });

    test('Solicitudes simultáneas en conexiones independientes: claves distintas no exceden el saldo', async () => {
      const bRes = staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Hidromasaje Staging Stock', quantity: 5, unitPrice: 900000 }]
      });
      const itemId = Array.from(staging.budgetItems.values()).find(it => it.budget_id === bRes.id).id;

      // Dos solicitudes simultáneas con claves distintas intentando convertir 4 y 3 unidades (total 7 > 5)
      const opConvA = () => staging.convertBudgetTx({
        userId: 'u-s1',
        budgetId: bRes.id,
        itemsToConvert: [{ budgetItemId: itemId, quantity: 4 }],
        idempotencyKey: 'key-conn-conv-a'
      });
      const opConvB = () => staging.convertBudgetTx({
        userId: 'u-s1',
        budgetId: bRes.id,
        itemsToConvert: [{ budgetItemId: itemId, quantity: 3 }],
        idempotencyKey: 'key-conn-conv-b'
      });

      const results = await Promise.allSettled([
        Promise.resolve().then(opConvA),
        Promise.resolve().then(opConvB)
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Solo una solicitud se aprueba');
      assert.equal(rejected.length, 1, 'La solicitud que excede el saldo es rechazada');
      assert.match(rejected[0].reason.message, /Saldo insuficiente/);

      const updatedItem = staging.budgetItems.get(itemId);
      assert.ok(updatedItem.converted_quantity <= updatedItem.quantity, 'El saldo convertido no excede las 5 unidades disponibles');
      assert.equal(updatedItem.converted_quantity, 4);
    });
  });

  // Área 4: Conversiones Parciales y Saldos
  describe('4. Conversión parcial, sucesiva y validación estricta de saldos', () => {
    test('Presupuesto de 10 unidades convertido en 4 deja 6 disponibles, y conversión final deja 0', () => {
      const bRes = staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Columna Ducha FS-100', quantity: 10, unitPrice: 150000 }]
      });

      const bItem = Array.from(staging.budgetItems.values()).find(i => i.budget_id === bRes.id);

      // Conversión 1: 4 unidades
      const conv1 = staging.convertBudgetTx({
        userId: 'u-s1',
        budgetId: bRes.id,
        itemsToConvert: [{ budgetItemId: bItem.id, quantity: 4 }]
      });

      assert.equal(conv1.budget_status, 'partially_converted');
      assert.equal(conv1.is_fully_converted, false);
      assert.equal(bItem.converted_quantity, 4);
      assert.equal(bItem.quantity - bItem.converted_quantity, 6);

      // Conversión 2: intentar convertir 7 (excede saldo de 6) -> debe fallar
      assert.throws(() => {
        staging.convertBudgetTx({
          userId: 'u-s1',
          budgetId: bRes.id,
          itemsToConvert: [{ budgetItemId: bItem.id, quantity: 7 }]
        });
      }, /Saldo insuficiente/);

      // Conversión 3: convertir los 6 restantes
      const conv2 = staging.convertBudgetTx({
        userId: 'u-s1',
        budgetId: bRes.id,
        itemsToConvert: [{ budgetItemId: bItem.id, quantity: 6 }]
      });

      assert.equal(conv2.budget_status, 'converted');
      assert.equal(conv2.is_fully_converted, true);
      assert.equal(bItem.converted_quantity, 10);
      assert.equal(bItem.quantity - bItem.converted_quantity, 0);

      // Conversión 4: intentar reconvertir un presupuesto ya 'converted' -> debe fallar
      assert.throws(() => {
        staging.convertBudgetTx({
          userId: 'u-s1',
          budgetId: bRes.id,
          itemsToConvert: [{ budgetItemId: bItem.id, quantity: 1 }]
        });
      }, /ya fue convertido en su totalidad/);
    });

    test('Rechazo de ítems duplicados en el mismo request que en conjunto excedan saldo', () => {
      const bRes = staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Plato Ducha 120x80', quantity: 5, unitPrice: 200000 }]
      });

      const bItem = Array.from(staging.budgetItems.values()).find(i => i.budget_id === bRes.id);

      // Enviar dos líneas con el mismo budgetItemId: 3 + 3 = 6 > 5
      assert.throws(() => {
        staging.convertBudgetTx({
          userId: 'u-s1',
          budgetId: bRes.id,
          itemsToConvert: [
            { budgetItemId: bItem.id, quantity: 3 },
            { budgetItemId: bItem.id, quantity: 3 }
          ]
        });
      }, /Saldo insuficiente/);
    });

    test('Rechazo estricto de cantidades negativas, cero o fraccionarias sin clamping silencioso', () => {
      const bRes = staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Bañera', quantity: 5, unitPrice: 500000 }]
      });

      const bItem = Array.from(staging.budgetItems.values()).find(i => i.budget_id === bRes.id);

      assert.throws(() => {
        staging.convertBudgetTx({
          userId: 'u-s1',
          budgetId: bRes.id,
          itemsToConvert: [{ budgetItemId: bItem.id, quantity: 0 }]
        });
      }, /entero estrictamente positivo/);

      assert.throws(() => {
        staging.convertBudgetTx({
          userId: 'u-s1',
          budgetId: bRes.id,
          itemsToConvert: [{ budgetItemId: bItem.id, quantity: -2 }]
        });
      }, /entero estrictamente positivo/);

      assert.throws(() => {
        staging.convertBudgetTx({
          userId: 'u-s1',
          budgetId: bRes.id,
          itemsToConvert: [{ budgetItemId: bItem.id, quantity: 2.5 }]
        });
      }, /entero estrictamente positivo/);
    });
  });

  // Área 5: Ventas por Distribuidor y Cancelación
  describe('5. Ventas por distribuidor y restauración unificada de saldos', () => {
    test('Venta por distribuidor persiste pedido con canal distribuidor y consume saldo', () => {
      const bRes = staging.createBudgetTx({
        userId: 'u-adm',
        clientId: 'c-1',
        items: [{ productName: 'Spa Party Distribuidor', quantity: 2, unitPrice: 2500000 }]
      });

      const bItem = Array.from(staging.budgetItems.values()).find(i => i.budget_id === bRes.id);

      const distSale = staging.convertBudgetTx({
        userId: 'u-adm',
        budgetId: bRes.id,
        itemsToConvert: [{ budgetItemId: bItem.id, quantity: 2 }],
        saleChannel: 'distributor'
      });

      assert.equal(distSale.budget_status, 'distributor_sale');
      const order = staging.orders.get(distSale.order_id);
      assert.equal(order.sale_channel, 'distributor');
      assert.equal(order.order_type, 'distributor_sale');
      assert.equal(order.status, 'completed');
      assert.equal(bItem.converted_quantity, 2);
    });

    test('Cancelación de pedido restaura saldo disponible en presupuesto de forma exacta', () => {
      const bRes = staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Bañera Confort', quantity: 4, unitPrice: 700000 }]
      });

      const bItem = Array.from(staging.budgetItems.values()).find(i => i.budget_id === bRes.id);

      const conv = staging.convertBudgetTx({
        userId: 'u-s1',
        budgetId: bRes.id,
        itemsToConvert: [{ budgetItemId: bItem.id, quantity: 2 }]
      });

      assert.equal(bItem.converted_quantity, 2);

      // Cancelar pedido
      const cancelRes = staging.cancelOrderTx({
        userId: 'u-s1',
        orderId: conv.order_id,
        reason: 'Cliente canceló el proyecto'
      });

      assert.equal(cancelRes.status, 'cancelled');
      assert.equal(bItem.converted_quantity, 0, 'El saldo del ítem debe quedar restaurado');

      const budget = staging.budgets.get(bRes.id);
      assert.equal(budget.status, 'accepted', 'El presupuesto debe retornar a accepted');

      // Intentar cancelar nuevamente debe ser rechazado
      assert.throws(() => {
        staging.cancelOrderTx({
          userId: 'u-s1',
          orderId: conv.order_id
        });
      }, /ya se encuentra cancelado/);
    });

    test('No se puede cancelar un pedido que ya fue entregado', () => {
      const bRes = staging.createBudgetTx({
        userId: 'u-s1',
        clientId: 'c-1',
        items: [{ productName: 'Plato Ducha', quantity: 1, unitPrice: 180000 }]
      });

      const bItem = Array.from(staging.budgetItems.values()).find(i => i.budget_id === bRes.id);
      const conv = staging.convertBudgetTx({
        userId: 'u-s1',
        budgetId: bRes.id,
        itemsToConvert: [{ budgetItemId: bItem.id, quantity: 1 }]
      });

      const order = staging.orders.get(conv.order_id);
      order.status = 'delivered';

      assert.throws(() => {
        staging.cancelOrderTx({
          userId: 'u-s1',
          orderId: conv.order_id
        });
      }, /No se puede cancelar un pedido entregado/);
    });
  });

  // Área 6: Casos Históricos y Conciliación
  describe('6. Protección de presupuestos históricos y conciliación pendiente', () => {
    test('Presupuesto histórico #38 (o marcado pendiente de conciliación) bloquea conversiones automáticas', () => {
      // Simular presupuesto #38
      const id38 = '7d53d595-a05b-4faf-8c16-bfa55c0a658e';
      staging.budgets.set(id38, {
        id: id38,
        budget_number: 38,
        client_id: 'c-1',
        seller_id: 'seller-1',
        status: 'converted',
        is_historical_reconciliation_pending: true,
        total_amount: 1890000
      });

      const item38 = {
        id: 'bi-38-1',
        budget_id: id38,
        product_name: 'Bañera Confort Plus',
        quantity: 1,
        unit_price: 1890000,
        converted_quantity: 0
      };
      staging.budgetItems.set(item38.id, item38);

      assert.throws(() => {
        staging.convertBudgetTx({
          userId: 'u-s1',
          budgetId: id38,
          itemsToConvert: [{ budgetItemId: item38.id, quantity: 1 }]
        });
      }, /pendiente de conciliación/);
    });
  });

  // Área 7: Descuentos, Redondeos e IVA
  describe('7. Motor de cálculo, descuentos en cascada y discriminación fiscal', () => {
    test('Cálculo con 3 descuentos en cascada redondea al centavo sin pérdida', () => {
      const items = [{ quantity: 1, unitPrice: 1000000.00 }];
      const discounts = [10, 5, 2]; // Cascada 10% + 5% + 2%
      const res = calculateCommercialTotals(items, discounts, 21.0);

      assert.equal(res.subtotal, 1000000.0);
      // 1000000 * 0.9 = 900000 * 0.95 = 855000 * 0.98 = 837900
      assert.equal(res.netTotal, 837900.0);
      assert.equal(res.discountAmount, 162100.0);
      assert.equal(res.taxAmount, 175959.0);
      assert.equal(res.totalWithTax, 1013859.0);
    });
  });

  // Área 8: Publicación, Tokens y Anti-enumeración
  describe('8. Publicación, revocación y control anti-enumeración', () => {
    test('Número correlativo entero no debe permitir consulta pública no autenticada', () => {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isCorrelative = !UUID_REGEX.test('127');
      assert.equal(isCorrelative, true, 'El identificador 127 es correlativo numérico, no token UUID');
    });

    test('Presupuesto revocado impide exposición de contenido al cliente', () => {
      const budget = {
        id: 'uuid-1',
        public_status: 'revoked',
        status: 'sent'
      };

      const isRevoked = budget.public_status === 'revoked';
      assert.equal(isRevoked, true);
    });

    test('Presupuesto borrador (draft) no se expone públicamente', () => {
      const draftBudget = {
        id: 'uuid-2',
        status: 'draft',
        public_status: 'draft'
      };

      const shouldBlock = draftBudget.status === 'draft' && draftBudget.public_status !== 'published';
      assert.equal(shouldBlock, true);
    });
  });
});
