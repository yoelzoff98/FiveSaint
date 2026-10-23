import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js';
import { ManufacturingClient } from '../src/app/administracion/fabricacion/ManufacturingClient.tsx';
import { ProductManufacturingClient } from '../src/app/administracion/fabricacion-productos/ProductManufacturingClient.tsx';

test('Pending manufacturing displays one order containing the bathtub and its addons', () => {
  const pendingItems = ['Bañera','Almohadilla','Jets extra'].map((product_name,index)=>({
    id:`line-${index}`,order_id:'order-26',product_name,quantity:index===2?2:1,
    manufacturing_issued_quantity:0,configuration_status:'approved',
    orders:{order_number:26,created_at:'2026-10-18T12:00:00Z',clients:{name:'Synthetic client'},sellers:{full_name:'Synthetic seller'}}
  }));
  const html=renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:{}},
    React.createElement(ManufacturingClient,{initialOrders:[],totalCount:0,serverPage:1,serverTotalPages:1,pendingItems,compositions:[],initialPendingView:true})));
  assert.equal((html.match(/Pedido #26/g)||[]).length,1);
  assert.equal((html.match(/<tr[ >]/g)||[]).length,2,'One header and one grouped order row');
  for (const item of pendingItems) assert.ok(html.includes(item.product_name));
});

test('Product manufacturing opens an existing recipe with decimal quantities, inactive historical components and instructions intact', () => {
  const html=renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:{}},
    React.createElement(ProductManufacturingClient,{
      products:[{id:'bath',name:'Bañera Perla',is_active:true}],variants:[],
      compositions:[{id:'recipe',name:'Receta Perla',technical_notes:null,product_id:'bath',variant_id:null,status:'published'}],productId:'bath',variantId:'',
      supplies:[{id:'resin',code:'RES',name:'Resina histórica',unit_of_measure:'kg',is_active:false}],options:[],
      recipe:{id:'recipe',name:'Receta Perla',status:'published',technical_notes:'Montar motor a la derecha',waste_percentage:4,
        items:[{supply_id:'resin',quantity:0.33,notes:'Reforzar la base'}]}
    })));
  for(const text of ['Bañera Perla','Resina histórica','Inactivo','0.33','Reforzar la base','Montar motor a la derecha','Guardar receta']) assert.ok(html.includes(text),text);
  assert.ok(!html.includes('BOM'),'No technical BOM terminology in the product editor');
});
