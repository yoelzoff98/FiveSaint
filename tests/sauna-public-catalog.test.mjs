import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {saunaData} from '../src/config/price-list-data.ts';
import {saunaPublicProduct,withPriceListSauna,withSaunaCategory} from '../src/config/sauna-public-catalog.ts';
import {SaunaPriceListDetails} from '../src/components/products/SaunaPriceListDetails.tsx';
import {filterPublicProducts} from '../src/lib/public-catalog.ts';

test('Sauna catalog uses the same models and images as the actual price list, without invented prices',()=>{
 assert.equal(saunaPublicProduct.slug,'sauna');
 assert.equal(saunaPublicProduct.price,undefined);
 assert.deepEqual(saunaPublicProduct.images.map(image=>image.url),saunaData.images);
 assert.deepEqual(saunaPublicProduct.variants.map(variant=>variant.capacityLabel),saunaData.models.map(model=>model.capacidad));
 for(const model of saunaData.models){
  const variant=saunaPublicProduct.variants.find(variant=>variant.capacityLabel===model.capacidad);
  for(const value of [model.consumo,...model.linea,model.cabinaCode,model.revestimientoCode])assert.ok(variant.features.some(feature=>feature.includes(value)),value);
 }
 for(const file of [...saunaData.images,...saunaData.models.map(model=>model.image)])assert.ok(fs.existsSync('public'+file),file);
 assert.deepEqual(filterPublicProducts([saunaPublicProduct],'sauna','FSSAU1C').map(p=>p.slug),['sauna']);
});

test('Sauna appears without replacing or mutating existing database products and categories',()=>{
 const products=[{id:'existing',slug:'romana'}];const copy=structuredClone(products);
 const result=withPriceListSauna(products);assert.equal(result.length,2);assert.deepEqual(products,copy);assert.equal(result[0],products[0]);
 assert.equal(withPriceListSauna(result),result);
 const managed=[{id:'database-sauna',slug:'sauna'}];assert.equal(withPriceListSauna(managed),managed);
 const categories=[{id:'existing',slug:'baneras'}];assert.equal(withSaunaCategory(categories).length,2);assert.equal(categories.length,1);
 const available=withSaunaCategory(categories);assert.equal(withSaunaCategory(available),available);
});

test('Full Sauna page renders capacities, codes, options, all existing photos, diagrams and quote contact',()=>{
 const html=renderToStaticMarkup(React.createElement(SaunaPriceListDetails));
 for(const model of saunaData.models){
  for(const value of [model.capacidad,model.consumo,...model.linea,model.cabinaCode,model.revestimientoCode])assert.ok(html.includes(value),value);
 }
 for(const optional of saunaData.opcionales){assert.ok(html.includes(optional.code));assert.ok(html.includes(optional.name));}
 for(const file of [...saunaData.images,...saunaData.models.map(model=>model.image)])assert.ok(html.includes(file)||html.includes(encodeURI(file))||html.includes(encodeURIComponent(file)),file);
 assert.ok(html.includes('Los Saunas se realizan a medida.'));assert.ok(html.includes('Los gráficos mostrados son solo a modo de ejemplo.'));
 assert.ok(html.includes('/contacto?ref=sauna'));assert.ok(html.includes('fivesaint@fivesaint.com'));
 assert.ok(!html.includes('homologado'));assert.ok(!html.includes('Termómetro e higrómetro'));
});
