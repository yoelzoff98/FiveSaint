import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AppRouterContext} from 'next/dist/shared/lib/app-router-context.shared-runtime.js';
import {normalizeCatalogText,catalogSearchText,filterPublicProducts,productImageAlt} from '../src/lib/public-catalog.ts';
import {ProductCatalog} from '../src/components/products/ProductCatalog.tsx';
import {contactFormSchema} from '../src/lib/validations/contact.ts';
import {productCategories} from '../src/config/product-categories.ts';
const product=(id,name,categorySlug,features=[])=>({id,name,slug:id,href:`/productos/${id}`,categoryId:categorySlug,categorySlug,categoryName:categorySlug,shortDescription:'Fabricación nacional',description:'Descripción',features,variants:[]});
const products=[product('romana','Romana','baneras',['Acrílico sanitario']),product('design','Design','spa-y-minipiscinas',['Cromoterapia']),product('escocesa','Ducha Escocesa','ducha-escocesa')];
test('Catalog search matches accents, model and characteristics and intersects category filters',()=>{
 assert.equal(catalogSearchText('  BAÑERAS  '),'baneras');
 assert.deepEqual(filterPublicProducts(products,'all','romana').map(p=>p.id),['romana']);
 assert.deepEqual(filterPublicProducts(products,'baneras','acrilico sanitario').map(p=>p.id),['romana']);
 assert.deepEqual(filterPublicProducts(products,'spa-y-minipiscinas','romana'),[]);
 assert.deepEqual(filterPublicProducts(products,'ducha-escocesa','').map(p=>p.id),['escocesa']);
 assert.deepEqual(filterPublicProducts(products,'all','no-existe'),[]);
 assert.equal(products[0].name,'Romana');
});
test('Public copy normalizes typos and measurements without altering underlying records or photo URLs',()=>{
 assert.equal(normalizeCatalogText('Desing'),'Design');
 assert.equal(normalizeCatalogText('Bombas 2 x 1000 W'),'Bombas 2 x 1000 W');
 assert.equal(normalizeCatalogText('Jets 2 x 6'),'Jets 2 x 6');
 assert.equal(normalizeCatalogText('Jets distribuídos'),'Jets distribuidos');
 assert.equal(normalizeCatalogText('218 X 225 X 100 CM'),'218 x 225 x 100 cm');
 assert.equal(normalizeCatalogText('Amplitud: 218 cm x 225 cm x 100 cm.'),'Amplitud: 218 x 225 x 100 cm.');
 assert.equal(normalizeCatalogText('Capacidad 6, 7 personas.'),'Capacidad 6 a 7 personas.');
 assert.equal(productImageAlt('Gemini_Generated_Image_xyz.png','Space',0),'Space Five Saint');
 assert.equal(productImageAlt('Detalle de jets','Romana',1),'Detalle de jets');
});
test('Server-rendered catalog includes actual search results and a usable search form before client hydration',()=>{
 const html=renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:{push(){}}},React.createElement(ProductCatalog,{products,categories:productCategories,initialQuery:'romana',initialCategory:'all'})));
 assert.ok(html.includes('/productos/romana'));
 assert.ok(!html.includes('/productos/design'));
 assert.ok(html.includes('name="q"'));assert.ok(html.includes('value="romana"'));
 assert.ok(!html.includes('Cargando catálogo'));
 const empty=renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:{push(){}}},React.createElement(ProductCatalog,{products,categories:productCategories,initialQuery:'xyz-no-existe'})));
 assert.ok(empty.includes('No encontramos productos'));
});
test('Contact required fields reject empty submissions and invalid email',()=>{
 assert.equal(contactFormSchema.safeParse({name:'',email:'',message:''}).success,false);
 assert.equal(contactFormSchema.safeParse({name:'Persona',email:'invalid',message:'Consulta de producto'}).success,false);
 assert.equal(contactFormSchema.safeParse({name:'Persona',email:'persona@example.invalid',message:'Consulta de producto',productInterest:productCategories[0].name}).success,true);
});
