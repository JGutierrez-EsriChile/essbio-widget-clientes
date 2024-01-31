///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define([
  'dojo/_base/declare','dojo/_base/lang','esri/tasks/query','esri/tasks/QueryTask','dojo/dom-construct','dojo/query','dojo/on',
  'dojo/_base/array','jimu/BaseWidget','esri/layers/FeatureLayer','esri/graphic', "esri/layers/GraphicsLayer",
  'jimu/portalUtils','jimu/portalUrlUtils',
  'esri/symbols/SimpleMarkerSymbol','esri/symbols/SimpleLineSymbol','esri/symbols/SimpleFillSymbol',
  'esri/Color',"esri/SpatialReference",'esri/geometry/webMercatorUtils',
  'dojox/charting/Chart','dojox/charting/themes/MiamiNice',
  "dojox/charting/plot2d/Lines",'dojox/charting/plot2d/Columns',
  'dojox/charting/action2d/Highlight',"dojox/charting/action2d/Tooltip","dojox/charting/action2d/Magnify",
  "dojox/charting/widget/Legend",'dojox/charting/plot2d/Markers','dojox/charting/axis2d/Default','dojo/domReady!'
],
function(
  declare, lang, Query, QueryTask, domConstruct, query, on, array, BaseWidget,FeatureLayer,Graphic, GraphicsLayer, portalUtils, portalUrlUtils,
  SimpleMarkerSymbol,SimpleLineSymbol, SimpleFillSymbol, Color, SpatialReference, webMercatorUtils,
  Chart,theme, LinesPlot, ColumnsPlot, Highlight, Tooltip, Magnify, Legend
  ) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    featureSet: new Array(),
    data: new Array(),
    token: null,
    InfoClientes: null,
    setFeatsEvt: null,
    selChgEvt: null,
    clearFeatsEvt: null,
    meses: [],
    featureLy:"",
    waitTime: 0,
    baseClass: 'jimu-widget-historialClientes',

    postCreate: function() {
      this.inherited(arguments);
      this.InfoClientes = this.map.infoWindow;
      this.eventoMapaCliente();
      console.log('postCreate');
    },
    startup: function() {
      this.inherited(arguments);
      //that.map.on("click", lang.hitch(that, that.onMapClick));
      this.featureLy = this.config.featureLy
      this.meses = this.config.meses
      console.log('startup');
    },
    onOpen: function(){
      this.clear();
      this.inherited(arguments);
      this.featureLy = "https://sigdesa.essbio.cl/server/rest/services/CLIENTES/FeatureServer/2";
      this.meses = ["N/A","ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
      //this.map.setInfoWindowOnClick(false);
      if (this.map.infoWindow.isShowing){this.map.infoWindow.hide();}
      console.log('onOpen',this.map);
      this.getPanel().setPosition({relativeTo: "map", top: 5, right: 5, bottom: 5, zIndex: 5, width: 360});
    },
    onClose: function(){
      this.clear();
      this.getPanel().setPosition({relativeTo: "map", top: 5, right: 5, bottom: 5, zIndex: 5, width: 360});
      console.log('onClose');
    },
    onMinimize: function(){
      console.log('onMinimize');
    },
    onMaximize: function(){
      console.log('onMaximize');
    },
    onSignIn: function(credential){
      console.log('onSignIn');
    },
    onSignOut: function(){
      console.log('onSignOut');
    },
    
    eventoMapaCliente: function(){
      var that = this;
      this.own(this.setFeatsEvt = on(this.InfoClientes, "set-features", lang.hitch(this, function(){
        that.clear()
        var inputClientes = document.getElementById("inputClientes")

        //enable navigation if more than one feature is selected
        if(this.InfoClientes.features.length > 0){
          /*- formulario para direcciones*/;
          this.InfoClientes.features.forEach(f => {
            var layerName = f.getLayer().name;
            if(layerName.toLowerCase().includes('cliente')){
              that.resaltarEnMapa(f, [78,206,186], 16);
              inputClientes.style.display = this.InfoClientes.features.length > 1 ? 'block':'none';
              that.set_Client(f);
            } else if(layerName.toLowerCase().includes('service connection')){
              that.resaltarEnMapa(f, [78,206,186], 16);
              var id_troncal = f.attributes['id_troncal'];
              that.search_Client_By_IDTRONCAL(id_troncal)
            }
          });
        }
        //enable navigation if more than one feature is selected
        if (this.InfoClientes.features.length === 0) that.clear();

      })));
      this.own(this.clearFeatsEvt = on(this.map.infoWindow, "clear-features", lang.hitch(this, function (evt) {
        if(!evt.isIntermediate){
          this.clear();
        }
      })));
    },
    search_Client_By_IDTRONCAL: function (id_troncal) {
      var that = this;
      var query = new Query();
      query.where = "id_troncal = " + id_troncal;
      query.returnGeometry = true;
      query.outFields = ['*'];
      query.outSpatialReference= new SpatialReference(102100);
      var qt = new QueryTask(that.featureLy);
      qt.execute(query, function (response) {
        var inputClientes = document.getElementById("inputClientes")
        inputClientes.style.display = response.features.length > 1 ? 'block':'none';
        response.features.forEach(ft => {
          that.set_Client(ft)
        });
      });
    },
    set_Client: function (f) {
      // console.log(f.attributes)
      var id_troncal = f.attributes['id_troncal'];
      var numerocliente = f.attributes['numerocliente'];
      //add client in list
      var clientInList = domConstruct.create("option",{
        'value': numerocliente,
        'id': numerocliente,
        'innerHTML': numerocliente,
      }, inputClientes);
      //if client is troncal
      if( id_troncal == numerocliente){
        document.getElementById("idTroncal").value = id_troncal
        document.getElementById("searchClient").value = numerocliente
        clientInList.selected = true;
      }
    },

    crear_Grafico: function (data_xml){
      var that = this
      that.getPanel().setPosition({relativeTo: "map", top: 5, right: 5, bottom: 200, zIndex: 5, width: 560});

      // Define the data
      var i = 12
      var chartX = new Array();
      var chartY1 = new Array();
      var chartY2 = new Array();

      for (let item of data_xml) {
        const FECFAC = item.getElementsByTagName("FECFAC")[0].innerHTML.trim()
        const CONSUMO = Number(item.getElementsByTagName("CONSUMO")[0].innerHTML.trim())
        const MONFAC = Number(item.getElementsByTagName("MONFAC")[0].innerHTML.trim())
        my = FECFAC.split("/")
        monthYear = that.meses[Number(my[1])]+"/"+my[2].substring(2)
        //??
        chartX.push({ value: i--, text: monthYear })
        chartY1.push(CONSUMO)
        chartY2.push(MONFAC)
      }
      var x_reverse = chartX.reverse()
      var y1_reverse = chartY1.reverse()
      var y2_reverse = chartY2.reverse()
      
      //Agregando grafico
      that.clearNode("graficosClientes");
      var titulo = domConstruct.create("div", {'class':'alert text-center col-sm-11', 'id':'titulo'}, "graficosClientes");
      titulo.innerHTML = "\n\n<h6>Consumo y Facturación Mensual de Agua Potable</h6>";

      //CREANDO GRAFICO
      domConstruct.create("div", {'id':'grafico'}, "graficosClientes");
      var chart = new Chart("grafico");
      chart.setTheme(theme);
      chart.addPlot("linea", {type: LinesPlot, markers: true});
      chart.addPlot("columns", {type: ColumnsPlot, gap: 2});

      chart.addAxis("x", { titleOrientation: "away", title: "Mes/año", labels: x_reverse, dropLabels: false});
      chart.addAxis("y", { titleOrientation: "away", title: "Consumo / Facturación (m3)", vertical: true, includeZero: true}); //Facturación (m3)
      chart.addSeries("&nbsp; Consumo Mensual (m3) &nbsp;", y1_reverse,{plot: "columns"});
      chart.addSeries("&nbsp; Facturación (m3)     &nbsp;", y2_reverse,{plot: "linea"});

      new Highlight(chart,"columns")
      new Tooltip(chart,"linea");
      new Magnify(chart,"linea");

      // Render the chart!
      chart.render();

      // Create the legend
      id = "legend_graf_" + Date.now()
      console.log(id)
      domConstruct.create("div", {'id':id}, "graficosClientes");
      var legend = new Legend({ chart: chart }, id);
      // setTimeout(() => {legend.destroy();}, 1000);
      
      return chart;
    },
    crear_Tabla: function (featureSelect, data_xml){
      var that = this
      //Atributos Tabla clientes
      const attr = featureSelect.attributes;
      const id_tmp = attr.numerocliente;
      //Atributos SAP
      const datasap_ultimomes = data_xml[0];
      const SERVICIO = datasap_ultimomes.getElementsByTagName("SERVICIO")[0].innerHTML.trim();
      const FECFAC   = datasap_ultimomes.getElementsByTagName("FECFAC" )[0].innerHTML.trim();
      const LECTURA  = datasap_ultimomes.getElementsByTagName("LECTURA")[0].innerHTML.trim();
      const CONSUMO  = datasap_ultimomes.getElementsByTagName("CONSUMO")[0].innerHTML.trim();
      const MONFAC   = datasap_ultimomes.getElementsByTagName("MONFAC" )[0].innerHTML.trim();
      const SALANT   = datasap_ultimomes.getElementsByTagName("SALANT" )[0].innerHTML.trim();
      const TOTBOL   = datasap_ultimomes.getElementsByTagName("TOTBOL" )[0].innerHTML.trim();
      const FOLIO    = datasap_ultimomes.getElementsByTagName("FOLIO" )[0].innerHTML.trim();
      const TIPDOC   = datasap_ultimomes.getElementsByTagName("TIPDOC" )[0].innerHTML.trim();
      const tipodoc  = TIPDOC == 33 ? "33 - Factura" : TIPDOC == 34 ? "34 - Factua Excenta" : TIPDOC == 39 ? "39 - boleta" : TIPDOC

      console.log(attr, datasap_ultimomes);
      var cardClient   = domConstruct.create("div", {'id':'ct_'.concat(id_tmp), 'class':'border-success card bg-light mb-3'}, "espacioCL");
      var ClientHeader = domConstruct.create("div", {'id':'hd_'.concat(id_tmp), 'class':'border-success card-header'}, cardClient);
      var clientBody   = domConstruct.create("div", {'id':'bd_'.concat(id_tmp), 'class':'border-success card-body'  }, cardClient);
      var clientFoot   = domConstruct.create("div", {'id':'ft_'.concat(id_tmp), 'class':'border-success card-footer'}, cardClient);

      //cabecera
      var clientTittle = domConstruct.create("h6",   {'id':'tt_'.concat(id_tmp), 'class':'card-title text-success' }, ClientHeader);
      clientTittle.innerHTML = "ID Troncal: "+ attr.id_troncal + " / Numero de Cliente: " + attr.numerocliente

      //tabla de datos
      var table = domConstruct.create("table", {'id':'tT_'.concat(id_tmp), 'class':'table table-condensed'}, clientBody);
      var tBody = domConstruct.create("tbody", {'id':'bT_'.concat(id_tmp), 'class':''}, table);
      //insert data:
      // insert_row(tBody, "ID Troncal", attr.id_troncal)
      // insert_row(tBody, "Número Cliente", attr.numerocliente)
      insert_row(tBody, "Nombre", attr.nombre)
      insert_row(tBody, "Dirección", attr.direccion)
      insert_row(tBody, "Consumo Promedio AP", attr.consumo_promedio_ap)
      // insert_row(tBody, "Consumo Promedio AS", attr.consumo_promedio_as)
      insert_row(tBody, "Días Morosidad", attr.dias_morosidad)
      insert_row(tBody, "Deuda", attr.deuda)
      insert_row(tBody, "Tipo Medidor", attr.tipo_medidor)
      insert_row(tBody, "", "")
      insert_row(tBody, "Tipo Último Documento", tipodoc)
      insert_row(tBody, "Última Lectura Facturada", LECTURA)
      insert_row(tBody, "Saldo Anterior ($)", SALANT)
      insert_row(tBody, "Cobro del mes ($)", Number(TOTBOL)*1000-Number(SALANT)*1000)

      //pie de tabla
      clientFoot.innerHTML  = "<h6>";
      clientFoot.innerHTML += (attr.clie_ap == 'S')? "Cliente de Agua Potable" : "Cliente sin Agua Potable" ;
      clientFoot.innerHTML += (attr.clie_as == 'S')? " / con servicio de Aguas Servidas" : " / sin servicio de Aguas Servidas" ;
      clientFoot.innerHTML += "</h6>";

      function insert_row (tBody, campo, valor){
        var dat = tBody.insertRow(-1);
        if (campo != "" || valor != ""){
          dat.insertCell(-1).innerHTML = campo;
          dat.insertCell(-1).innerHTML = ":";
          dat.insertCell(-1).innerHTML = valor;
        } else{
          dat.insertCell();
          dat.insertCell();
          dat.insertCell();

        }
        dat.insertCell(-1).innerHTML =  "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";

        dat.childNodes.forEach (hijo =>{hijo.style.padding = ".1rem";})
      }
    },
    _onclickBuscarClient: function () {
      var that = this
      var nroCliente = document.getElementById("searchClient").value;
      var idTroncal = document.getElementById("idTroncal").value;
      that.clear()

      // document.getElementById("espacioCL").innerHTML = "<br><br>Cargando datos de cliente. . .<br>";
      // var gifLoad = "./configs/loading/images/predefined_loading_2.gif";
      // domConstruct.create("img",{ 'src':gifLoad },"espacioCL");

      if(nroCliente != "")
      {
        document.getElementById("searchClient").value = nroCliente
        document.getElementById("idTroncal").value = idTroncal
        var query = new Query();
        query.returnGeometry = true;
        query.where = "NUMEROCLIENTE= " + nroCliente;
        query.outFields = ['*'];

        var qt = new QueryTask(that.featureLy);
        qt.execute(query, function (response) {
          if (response.features.length > 0){
            response.features.forEach(ft => {
              that.resaltarEnMapa(ft, [78,206,186], 16);
              // SAP_data = that.Consulta_API(nroCliente)
              SAP_data = that.emula_consulta()
              that.crear_Grafico(SAP_data)
              that.crear_Tabla(ft, SAP_data)
            });
          }else{
            document.getElementById("espacioCL").innerHTML = "<br><br>El cliente ingresado no existe.<br>";
          }
        });
      }else{
        document.getElementById("espacioCL").innerHTML = "<br><br>Debe ingresar un numero de cliente para buscar.<br>";
      }
    },
    selectClientInWidget: function (slct) {
      // this.clear()
      var searchClient = document.getElementById("searchClient");
      var inputClientes = document.getElementById("inputClientes");
      searchClient.value = inputClientes.value
    },
    /*- CARGAR DATOS CLIENTES-*/
    getDataClientes: async function (numerocliente) {
      var portalUrl = portalUrlUtils.getStandardPortalUrl(this.appConfig.portalUrl);
      var portal = portalUtils.getPortal(portalUrl);
      var userPortal = await this.awaitResolve(portal.getUser());

      var data = {
        'cliente':{
          'numerocliente': Number(numerocliente)
        },
        'token': userPortal.credential.token
      };
      return data;
    },
    Consulta_API: async function (numerocliente){
      document.getElementById("espacioCL").innerHTML = '<br><br>Guardando...';
      var that = this;
      var API_GIS = 'https://appdesa.essbio.cl/cliente/api/Clientes';

      dataProm = this.getDataClientes(numerocliente)
      data = await this.awaitResolve(dataProm);

      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      var raw = JSON.stringify(data, undefined);

      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };

      console.log("requestOptions: ", requestOptions);

      fetch(API_GIS, requestOptions)
        .then(response => response.text())
        .then(result => {
          var respuestaPost = JSON.parse(result);
          console.log(respuestaPost);

          that.clearNode("espacioCL");
          if("Croquis_ID" in respuestaPost){
            var mensaje = "Hemos recibido tu croquis ID: " + respuestaPost.Croquis_ID;
            document.getElementById("espacioCL").innerHTML = '<br><br>' + mensaje;
          }else{
            document.getElementById("espacioCL").innerHTML = '<br><br>terminado';
          };
        })
        .catch(error => {
          document.getElementById("espacioCL").innerHTML = '<br><br>Se ha producido un error al cargar la informacion. Favor comunicarse con soporte.';
          console.log('error', error);
        });
    },
    ConsultaAPI_test: async function (numerocliente){
      var that = this;
      var API_GIS = 'https://appdesa.essbio.cl/cliente/api/Clientes/_PASS_';
      API_GIS += numerocliente;
      console.log(API_GIS)

      //Consulta API
      const requestURL = API_GIS;
      const request = new XMLHttpRequest();
      request.open('GET', requestURL, true);
      request.responseType = 'json';
      request.onload = async function() {
        if(request.readyState == 4 && request.status == 200){
          RESPONSE = Object.entries(request.response);
          var apiResponse = await promiseAPI(RESPONSE);
        }
        else{
          that.clearNode("espacioCL");
          document.getElementById("espacioCL").innerHTML = "<br><br>error en la consulta de datos<br>";
        }
      }
      request.send();
      /*-*/
      async function promiseAPI(RESPONSE){
        var arrayWait = [];
        await Promise.all(RESPONSE.map(async ([key, value]) => {arrayWait.push(value)}))
        that.waitTime++;
        return arrayWait;
      }
    },
    emula_consulta: function (numerocliente){
      var that = this
      const parser = new DOMParser();
      /*-* /
      fetch('./widgets/historialClientes/test-client.xml')
        .then(res => res.text())
        .then(text => {
          const xmlDoc = parser.parseFromString(text,"text/xml");
          that.crear_Grafico(xmlDoc.getElementsByTagName("item"))
        });
      /*-*/
      var test_xml = "<env:Envelope xmlns:env=\"http://www.w3.org/2003/05/soap-envelope\"><env:Header/><env:Body><n0:ZDM_018_INT_04Response xmlns:n0=\"urn:sap-com:document:sap:rfc:functions\"><E_ERROR/><T_FACTURAS_OUT><item><SERVICIO>2189842</SERVICIO><FECFAC>15/11/2023</FECFAC><LECTURA>859</LECTURA><CONSUMO>18</CONSUMO><MONFAC>18</MONFAC><SALANT>0</SALANT><TOTBOL>11.380</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000092436769</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>16/10/2023</FECFAC><LECTURA>841</LECTURA><CONSUMO>12</CONSUMO><MONFAC>12</MONFAC><SALANT>0</SALANT><TOTBOL>5.800</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000091612813</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>14/09/2023</FECFAC><LECTURA>829</LECTURA><CONSUMO>15</CONSUMO><MONFAC>15</MONFAC><SALANT>0</SALANT><TOTBOL>7.190</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000090720750</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>14/08/2023</FECFAC><LECTURA>814</LECTURA><CONSUMO>7</CONSUMO><MONFAC>7</MONFAC><SALANT>0</SALANT><TOTBOL>3.520</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000089893000</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>14/07/2023</FECFAC><LECTURA>807</LECTURA><CONSUMO>21</CONSUMO><MONFAC>21</MONFAC><SALANT>0</SALANT><TOTBOL>15.570</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000089042223</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>14/06/2023</FECFAC><LECTURA>786</LECTURA><CONSUMO>13</CONSUMO><MONFAC>13</MONFAC><SALANT>0</SALANT><TOTBOL>2.570</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000088189427</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>15/05/2023</FECFAC><LECTURA>773</LECTURA><CONSUMO>15</CONSUMO><MONFAC>15</MONFAC><SALANT>0</SALANT><TOTBOL>7.190</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000087338965</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>14/04/2023</FECFAC><LECTURA>758</LECTURA><CONSUMO>18</CONSUMO><MONFAC>18</MONFAC><SALANT>0</SALANT><TOTBOL>11.360</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000086510796</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>15/03/2023</FECFAC><LECTURA>740</LECTURA><CONSUMO>20</CONSUMO><MONFAC>20</MONFAC><SALANT>293</SALANT><TOTBOL>12.477</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000085664572</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>13/02/2023</FECFAC><LECTURA>721</LECTURA><CONSUMO>20</CONSUMO><MONFAC>20</MONFAC><SALANT>0</SALANT><TOTBOL>14.170</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000084800392</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>16/01/2023</FECFAC><LECTURA>701</LECTURA><CONSUMO>15</CONSUMO><MONFAC>15</MONFAC><SALANT>0</SALANT><TOTBOL>4.430</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000083958792</FOLIO></item><item><SERVICIO>2189842</SERVICIO><FECFAC>15/12/2022</FECFAC><LECTURA>692</LECTURA><CONSUMO>20</CONSUMO><MONFAC>20</MONFAC><SALANT>0</SALANT><TOTBOL>13.970</TOTBOL><TIPDOC>39</TIPDOC><FOLIO>SII-000083104501</FOLIO></item></T_FACTURAS_OUT></n0:ZDM_018_INT_04Response></env:Body></env:Envelope>"
      const xmlDoc = parser.parseFromString(test_xml,"text/xml");
      item = xmlDoc.getElementsByTagName("item")
      return item
    },
    /*- FUNCIONES SECUNDARIAS -*/
    resaltarEnMapa(feature, RGBA, size){
      if (feature){
        console.log("add feature in map:", feature)
        var L = RGBA.length;
        var R = (L > 0) ? RGBA[0] : 0;
        var G = (L > 1) ? RGBA[1] : 142; 
        var B = (L > 2) ? RGBA[2] : 216;
        var A = (L > 3) ? RGBA[3] : 0.25;
        var SIZE = (size > 0) ? size : 10;
        //pintado
        if (feature.geometry.type == "point" ||feature.geometry.type == "multiPoint") {
          //linea
          var simbologia = new SimpleMarkerSymbol(
            SimpleMarkerSymbol.STYLE_CIRCLE, 
            SIZE,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([R,G,B]), 2),
            new Color([R,G,B,A])
          );
        }
        else if (feature.geometry.type == "line" ||feature.geometry.type == "polyline") {
          var simbologia = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([R,G,B]), 2);
        }
        
        var graphicElemnts = new Graphic(feature.geometry, simbologia, feature.attributes);
        this.map.graphics.add(graphicElemnts);
        // var stateExtent = feature.geometry.getExtent();//.expand(5.0);
        // this.map.setExtent(stateExtent);
      };
    }, 
    awaitResolve: function(wait){
      return new Promise(resolve=>setTimeout(()=>resolve(wait),500))
    },
    clear : function (){
      console.clear();
      this.map.graphics.clear();
      this.clearNode("tituloCL");
      this.clearNode("inputClientes");
      this.clearNode("graficosClientes");
      this.clearNode("espacioCL");
      this.getPanel().setPosition({relativeTo: "map", top: 5, right: 5, bottom: 5, zIndex: 5, width: 360});
      document.getElementById("idTroncal").value = ""
      document.getElementById("searchClient").value = ""
      document.getElementById("inputClientes").style.display = "none"
      // document.getElementById("op0CL").selected = true;
    },
    clearNode: function(nameNode) {
      var node = document.getElementById(nameNode);
      while (node.hasChildNodes()) {
        node.removeChild(node.firstChild);
      };
    }
  });
});
