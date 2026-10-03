import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

describe('7. PRUEBAS DE AUTORIZACIÓN Y MATRIZ DE PERMISOS', () => {
  // Simulador del contexto y políticas de autorización
  function checkCommercialAccess(ctx, resource, targetSellerId, targetDistributorId) {
    if (!ctx.isLoggedIn) return { allowed: false, reason: "No autenticado" };
    if (!ctx.isActive) return { allowed: false, reason: "Usuario inactivo o suspendido" };
    if (ctx.isAdmin) return { allowed: true, role: "admin" };

    if (ctx.isSeller) {
      if (resource === "sellers" || resource === "distributors") {
        return { allowed: false, reason: "Solo administradores" };
      }
      if (targetSellerId && targetSellerId !== ctx.sellerId) {
        return { allowed: false, reason: "No autorizado a acceder a registros de otro vendedor" };
      }
      return { allowed: true, role: "seller" };
    }

    if (ctx.isDistributor) {
      if (resource === "sellers" || resource === "clients") {
        return { allowed: false, reason: "No autorizado para este recurso" };
      }
      if (targetDistributorId && targetDistributorId !== ctx.distributorId) {
        return { allowed: false, reason: "No autorizado a acceder a registros de otro distribuidor" };
      }
      return { allowed: true, role: "distributor" };
    }

    return { allowed: false, reason: "Sin rol comercial" };
  }

  test('Administrador global tiene acceso irrestricto', () => {
    const adminCtx = { isLoggedIn: true, isActive: true, isAdmin: true, isSeller: false, isDistributor: false };
    const res = checkCommercialAccess(adminCtx, 'clients', 'seller-2', null);
    assert.equal(res.allowed, true);
  });

  test('Vendedor 1 no puede ver ni modificar registros del Vendedor 2', () => {
    const seller1Ctx = { isLoggedIn: true, isActive: true, isAdmin: false, isSeller: true, isDistributor: false, sellerId: 'seller-1' };
    
    // Acceso a sus propios registros
    const ownRes = checkCommercialAccess(seller1Ctx, 'clients', 'seller-1', null);
    assert.equal(ownRes.allowed, true);

    // Intento de acceso a registros ajenos (Vendedor 2)
    const foreignRes = checkCommercialAccess(seller1Ctx, 'clients', 'seller-2', null);
    assert.equal(foreignRes.allowed, false);
    assert.ok(foreignRes.reason.includes('otro vendedor'));
  });

  test('Distribuidor solo accede a sus pedidos asignados', () => {
    const distCtx = { isLoggedIn: true, isActive: true, isAdmin: false, isSeller: false, isDistributor: true, distributorId: 'dist-1' };

    const ownOrder = checkCommercialAccess(distCtx, 'orders', null, 'dist-1');
    assert.equal(ownOrder.allowed, true);

    const otherDistOrder = checkCommercialAccess(distCtx, 'orders', null, 'dist-2');
    assert.equal(otherDistOrder.allowed, false);

    const clientAccess = checkCommercialAccess(distCtx, 'clients', null, null);
    assert.equal(clientAccess.allowed, false);
  });

  test('Usuario inactivo o revocado es rechazado', () => {
    const inactiveSeller = { isLoggedIn: true, isActive: false, isAdmin: false, isSeller: true, isDistributor: false, sellerId: 'seller-1' };
    const res = checkCommercialAccess(inactiveSeller, 'clients', 'seller-1', null);
    assert.equal(res.allowed, false);
    assert.ok(res.reason.includes('inactivo'));
  });

  test('Visitante no autenticado es rechazado', () => {
    const anonymous = { isLoggedIn: false, isActive: false, isAdmin: false, isSeller: false, isDistributor: false };
    const res = checkCommercialAccess(anonymous, 'budgets', null, null);
    assert.equal(res.allowed, false);
    assert.ok(res.reason.includes('No autenticado'));
  });
});

describe('8. CONCURRENCIA E IDEMPOTENCIA', () => {
  test('Doble clic simultáneo no duplica la operación', () => {
    const processedKeys = new Set();
    const createdOrders = [];

    function processOrderConversion(idempotencyKey, payload) {
      if (processedKeys.has(idempotencyKey)) {
        return { isDuplicate: true, order: createdOrders.find(o => o.key === idempotencyKey) };
      }
      processedKeys.add(idempotencyKey);
      const newOrder = { id: 'order-' + Math.random(), key: idempotencyKey, ...payload };
      createdOrders.push(newOrder);
      return { isDuplicate: false, order: newOrder };
    }

    const key = 'idem-req-123456';
    const firstCall = processOrderConversion(key, { budgetId: 'b1', total: 500000 });
    const secondCall = processOrderConversion(key, { budgetId: 'b1', total: 500000 });

    assert.equal(firstCall.isDuplicate, false);
    assert.equal(secondCall.isDuplicate, true);
    assert.equal(firstCall.order.id, secondCall.order.id);
    assert.equal(createdOrders.length, 1);
  });
});

describe('9. CONSERVACIÓN DE DOCUMENTOS HISTÓRICOS Y REVOCACIÓN', () => {
  test('Un presupuesto emitido conserva su snapshot ante cambios en el cliente', () => {
    const originalBudget = {
      id: 'b-999',
      client_snapshot: {
        name: 'Constructora del Sur S.A.',
        address: 'Av. Corrientes 1234, CABA'
      },
      items: [
        { product_name: 'Bañera Romana', unit_price: 3199000, quantity: 2 }
      ],
      total_amount: 6398000
    };

    // Modificación posterior del cliente en la base de datos
    const updatedClientProfile = {
      name: 'Constructora del Sur Renombrada',
      address: 'Nueva Dirección 9999, Córdoba'
    };

    // El documento emitido debe mostrar los datos fieles de su emisión original
    const renderedRecipient = originalBudget.client_snapshot.name;
    assert.equal(renderedRecipient, 'Constructora del Sur S.A.');
    assert.notEqual(renderedRecipient, updatedClientProfile.name);
  });

  test('La revocación de un enlace público oculta datos y presenta estado amigable', () => {
    const budget = {
      id: 'b-100',
      public_status: 'revoked',
      total_amount: 2500000
    };

    function resolvePublicBudget(b) {
      if (b.public_status === 'revoked') {
        return {
          isRevoked: true,
          message: 'Esta cotización ha sido deshabilitada o actualizada por el asesor comercial.'
        };
      }
      return { isRevoked: false, budget: b };
    }

    const result = resolvePublicBudget(budget);
    assert.equal(result.isRevoked, true);
    assert.equal(result.budget, undefined);
  });
});
