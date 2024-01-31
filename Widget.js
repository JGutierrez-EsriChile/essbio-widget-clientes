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
  'dojox/charting/plot2d/Columns','dojox/charting/action2d/Highlight','dojox/charting/plot2d/Markers','dojox/charting/axis2d/Default','dojo/domReady!'
],
function(
  declare, lang, Query, QueryTask, domConstruct, query, on, array, BaseWidget,FeatureLayer,Graphic, GraphicsLayer, portalUtils, portalUrlUtils,
  SimpleMarkerSymbol,SimpleLineSymbol, SimpleFillSymbol, Color, SpatialReference, webMercatorUtils,
  Chart,theme, ColumnsPlot, Highlight
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
      this.featureLy = this.config.featureLy
      this.meses = this.config.meses
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
      that = this;
      this.own(this.setFeatsEvt = on(this.InfoClientes, "set-features", lang.hitch(this, function(){
        that.clear()
        var inputClientes = document.getElementById("inputClientes")

        //enable navigation if more than one feature is selected
        if(this.InfoClientes.features.length > 0){
          /*- formulario para direcciones*/;
          this.InfoClientes.features.forEach(f => {
            var layerName = f.getLayer().name;
            console.log(layerName);
            if(layerName.toLowerCase().includes('cliente')){
              inputClientes.style.display = this.InfoClientes.features.length > 1 ? 'block':'none';
              that.set_Client(f);
            } else if(layerName.toLowerCase().includes('service connection')){
              console.log(layerName, this.InfoClientes.features.length, f.attributes)
              var id_troncal = f.attributes['id_troncal'];
              that.search_Client_By_IDTRONCAL(id_troncal)
            }
          });
        }
        
        //enable navigation if more than one feature is selected
        if (this.InfoClientes.features.length === 0) that.clear();

      })));
      this.own(this.selChgEvt = on(this.map.infoWindow, "selection-change", lang.hitch(this, function (evt) {
        if(evt.target.getSelectedFeature()){
          // this.map.graphics.clear();
          // this.clear();
          console.log("selection-change\n", evt.target)
        }
      })));

      this.own(this.clearFeatsEvt = on(this.map.infoWindow, "clear-features", lang.hitch(this, function (evt) {
        if(!evt.isIntermediate){
          this.clear();
        }
      })));
    },
    search_Client_By_IDTRONCAL: function (id_troncal) {
      that = this;
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
              // that.Consulta_API(nroCliente)
              that.emula_consulta(nroCliente)
              cardCliente("espacioCL", ft)
              that.resaltarEnMapa(ft, [78,206,186], 16);
            });
          }else{
            document.getElementById("espacioCL").innerHTML = "<br><br>El cliente ingresado no existe.<br>";
          }
        });
      }else{
        document.getElementById("espacioCL").innerHTML = "<br><br>Debe ingresar un numero de cliente para buscar.<br>";
      }
      
      //informacion del cliente
      function cardCliente(div, featureSelect){
        var attributes = featureSelect.attributes;
        var nroCL = attributes.numerocliente;
        console.log(attributes);
        var cardClient   = domConstruct.create("div", {'id':'ct_'.concat(nroCL), 'class':'border-success card bg-light mb-3'}, div);
        var ClientHeader = domConstruct.create("div", {'id':'hd_'.concat(nroCL), 'class':'border-success card-header'}, cardClient);
        var clientBody   = domConstruct.create("div", {'id':'bd_'.concat(nroCL), 'class':'border-success card-body'  }, cardClient);
        var clientFoot   = domConstruct.create("div", {'id':'ft_'.concat(nroCL), 'class':'border-success card-footer'}, cardClient);

        var clientTittle = domConstruct.create("h6",   {'id':'tt_'.concat(nroCL), 'class':'card-title text-success' }, ClientHeader);

        //cabecera
        clientTittle.innerHTML = (attributes["clie_ap"] == 'S')? "Cliente AP" : "No Cliente AP" ;
        clientTittle.innerHTML += (attributes["clie_as"] == 'S')? " / Cliente AS" : " / No Cliente AS" ;

        //cuerpo
        var Clienttexto  = domConstruct.create("p",    {'id':'tx_'.concat(nroCL), 'class':'card-text'  }, clientBody);
        Clienttexto.innerHTML  = "datos clientes: ";

        //cabecera
        clientFoot.innerHTML = "<h4>";
        clientFoot.innerHTML += attributes["direccion"];
        // if(attributes["poblacion"] && attributes["poblacion"] != "") clientFoot.innerHTML +=", poblacion " +  attributes["poblacion"];
        clientFoot.innerHTML += "</h4>";

      };
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
    crear_Grafico: async function (data_xml){
      that = this
      that.getPanel().setPosition({relativeTo: "map", top: 5, right: 5, bottom: 200, zIndex: 5, width: 560});
      
      // Define the data
      var i = 12
      var chartX = new Array();
      var chartY = new Array();
      var chartData = new Array()
      for (let item of data_xml) {
        const FECFAC = item.getElementsByTagName("FECFAC")[0].innerHTML.trim()
        const CONSUMO = Number(item.getElementsByTagName("CONSUMO")[0].innerHTML.trim())
        my = FECFAC.split("/")
        monthYear = that.meses[Number(my[1])]+"/"+my[2].substring(2)
        chartData.push({ x: monthYear, y: CONSUMO })
        //??
        chartX.push({ value: i--, text: monthYear })
        chartY.push(CONSUMO)
      }
      x_reverse = chartX.reverse()
      y_reverse = chartY.reverse()
      console.log(x_reverse,y_reverse)
      
      //Agregando grafico
      that.clearNode("graficosClientes");
      var titulo = domConstruct.create("div", {'class':'alert text-center col-sm-11', 'id':'titulo'}, "graficosClientes");
      titulo.innerHTML = "\n\n<h6>Consumo Mensual de Agua Potable</h6>";
      //CREANDO GRAFICO
      var grafico = domConstruct.create("div", {'id':'grafico'}, "graficosClientes");
      var chart = new Chart("grafico");
      chart.setTheme(theme);
      chart.addPlot("default", {type: ColumnsPlot, gap: 2});
      chart.addAxis("x", { titleOrientation: "away", title:       "Mes/año", labels: x_reverse, dropLabels: false});
      chart.addAxis("y", { titleOrientation: "away", title: "Consumo en m3", vertical: true, includeZero: true});
      chart.addSeries("Consumo Mensual", y_reverse);
      new Highlight(chart,"default")
      chart.render();

      return chart;
    },
    emula_consulta: async function (numerocliente){
      that = this
      const parser = new DOMParser();
      /*-* /
      fetch('./widgets/historialClientes/test-client.xml')
        .then(res => res.text())
        .then(text => {
          const xmlDoc = parser.parseFromString(text,"text/xml");
          that.crear_Grafico(xmlDoc.getElementsByTagName("item"))
        });
      /*-*/
      const xmlDoc = parser.parseFromString(this.config.test_xml,"text/xml");
      that.crear_Grafico(xmlDoc.getElementsByTagName("item"))
    },
    _test_1_ConsultaAPI: async function (numerocliente){
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
    
    _getClientesInMap: async function(featureSet){
      var that = this;
      that.featureSet = new Array();
      that.waitTime = 0;
      that.resaltarEnMapa(featureSet, [78,206,186], 16)

      that.clearNode("tituloCL");
      that.clearNode("graficosClientes");
      that.clearNode("espacioCL");

      // document.getElementById("espacioCL").innerHTML = "<br><br>Cargando datos de cliente. . .<br>";
      // var gifLoad = "./configs/loading/images/predefined_loading_2.gif";
      // domConstruct.create("img",{ 'src':gifLoad },"espacioCL");

      var layerName = featureSet.getLayer().name;
      //click en una planta, una mufa o un CTO;
      if(layerName.includes('CLIENTES')||layerName.includes('Clientes')||layerName.includes('cliente')){
        var numerocliente = featureSet.attributes["numerocliente"];
        document.getElementById("searchClient").value = numerocliente
        // that.Consulta_API(numerocliente)
        // that.emula_consulta(numerocliente)
      }
      //funcion general para consultas en capas.
      async function consultarObjetos(fs, where){
        var QT =  new QueryTask(fs);

        var qr = new Query();
        qr.where = where;
        qr.outFields = ["*"];
        qr.returnGeometry = true;
        qr.outSpatialReference = {wkid: 102100};

        var response = QT.execute(qr);
        var prom = await response.promise;
        return prom.features;
      };
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
    insertCellWithStyle: function(row, colspan, textAlign, BorderInline, bgColor, centerColor, innerHTML) {
      var that = this;
      //var celda = row.insertCell(cell);
      var celda = row.insertCell(-1);

      var borderSolid  = "thin solid #000";
      celda.style.borderBlock = borderSolid;
      celda.style.borderTop = borderSolid;
      celda.style.borderBottom = borderSolid;
      if(BorderInline == "inline"){
        celda.style.borderInline = borderSolid;
        celda.style.borderRight = borderSolid;
        celda.style.borderLeft = borderSolid;
      }
      else if(BorderInline == "right"){
        celda.style.borderRight = borderSolid;
      }
      else if(BorderInline == "left"){
        celda.style.borderLeft = borderSolid;
      }
      if(centerColor != null) {
        var contrasteColor = ContractColor(centerColor);
        celda.style.color = contrasteColor;
        celda.style.backgroundImage  = bgImagen(bgColor, centerColor, contrasteColor);
      }
      else if(bgColor != null) {
        var contrasteColor = ContractColor(bgColor);
        celda.style.color = contrasteColor;
        celda.style.backgroundColor = bgColor;
      }

      celda.style.textAlign = textAlign //object.style.textAlign = "left|right|center|justify|initial|inherit" 
      celda.style.verticalAlign = "middle";
      celda.style.padding = ".1rem";
      celda.style.fontSize = "small";
      celda.colSpan = colspan;

      if(innerHTML) {
        celda.innerHTML = innerHTML;
      }
      function bgImagen(border, backgr, line){
        var str = "url(\"data:image/svg+xml, "
          str += "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' >"
            if(border) str += "<rect width='10%' height='100%' style='fill: " + border + ";'/>"
            str += "<rect y='20%' width='100%' height= '60%' style='fill: " + backgr + ";'/>"
            str += "<line x1='0' y1='20%' x2='100%' y2='20%' style='stroke:" + line + ";stroke-width:0.5'/>"
            str += "<line x1='0' y1='80%' x2='100%' y2='80%' style='stroke:" + line + ";stroke-width:0.5'/>"
          str += "</svg>"
        str += "\")";
        return str
      }
      function ContractColor(color){
        var leftRGBA = color.split('rgba(');
        if(leftRGBA.length > 1){
          var rightRGBA = leftRGBA[1].split(')');
          var RGBA = rightRGBA[0].split(', ');
          var R = RGBA[0], G = RGBA[1], B = RGBA[2];
        }
        else{
          var R = 0, G = 0, B = 0;
        }
       
        var lum = (((0.299 * R) + ((0.587 * G) + (0.114 * B))));
        return lum > 186 ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)";
      }
      return celda;
    }, 
    awaitResolve: function(wait){
      return new Promise(resolve=>setTimeout(()=>resolve(wait),500))
    },
  
    clear : function (){
      console.clear();
      this.map.graphics.clear();
      this.clearNode("tituloCL");
      this.clearNode("inputClientes");
      that.clearNode("graficosClientes");
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