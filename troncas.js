var express = require('express');

var app = express();

var randgen = require('randgen');
var quantile = require( 'distributions-triangular-quantile' );


app.use(express.static(__dirname + ''));

var server = app.listen(process.env.PORT || 8080, function () {
    console.log('listening on PORT:',server.address().port,'...');
});


app.post('/', function (req, res){
    var rep = parseInt(req.query.rep);
    var capacidadCamion = parseInt(req.query.capacidadCamion);
    var costoAlquiler = parseInt(req.query.costoAlquiler);
    var tA = parseFloat(req.query.tA);
    var tB = parseFloat(req.query.tB);
    var tC = parseFloat(req.query.tC);
    var poisson = parseFloat(req.query.poisson);

    var results = main(rep,capacidadCamion, costoAlquiler, tA, tB, tC, poisson);

    res.send(results);
})

function main(rep, capacidadCamion, costoAlquiler, tA, tB, tC, poisson ){
    iteraciones = [];
    var costoTotal = 0;

    for(var i = 0; i< rep; ++i){
        var camionCount = 1;
        var iteracion = {
            camiones : [{
                id:i+1,
                capacidad: capacidadCamion,
                disponible: capacidadCamion,
                troncas : []
            }],
            costo: 0
        }

        var nrotroncas = randgen.rpoisson(poisson);
        iteracion.nroTroncas = nrotroncas;
        for(var j = 0; j< nrotroncas; j++){
            
            var peso = quantile( Math.random(), {
                'a': tA,
                'b': tB,
                'c': tC
            });
            
            var tronca = {nro: j+1, peso: Math.round(peso*100)/100};
            
            var camion = iteracion.camiones.sort(function (a,b){ 
                return a.disponible < b.disponible
            }).filter(function (c) { 
                return c.disponible >= tronca.peso 
            })[0];
            
            if(camion){
                camion.troncas.push(tronca);
                camion.disponible -= tronca.peso;
            }
            else{
                camionCount++;

                iteracion.costo += costoAlquiler;
                iteracion.camiones.push({
                    id:i+1 + '.' + camionCount,
                    capacidad: capacidadCamion,
                    disponible: capacidadCamion - tronca.peso,
                    troncas: [tronca]
                })
            }
        }
        iteraciones.push(iteracion);
        costoTotal += iteracion.costo;

        console.log('**************************');
        console.log('\tDÍA', i+1);
        console.log('--------------------------');
        console.log('# TRONCAS:', iteracion.nroTroncas);
        console.log('# CAMIONES:', iteracion.camiones.length);
        console.log('CAMIONES:');
        var k = 1;
        iteracion.camiones.sort(function (c1, c2){
            return c1.disponible > c2.disponible
        }).forEach(function (c){
            console.log('\tCAMION', k);
            console.log('\t TRONCAS:',c.troncas);
            console.log('\t DISPONIBLE', Math.round(c.disponible*100)/100);
            ++k;
        })
        console.log('\nCOSTO:', iteracion.costo);
        console.log('**************************\n');
        
        
    }

    console.log('COSTO TOTAL: ', costoTotal);
    
    return { costoTotal: costoTotal, iteraciones: iteraciones };
}