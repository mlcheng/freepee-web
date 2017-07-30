"use strict";window.require=function e(t,o,n){function a(r,s){if(!o[r]){if(!t[r]){var l="function"==typeof require&&require;if(!s&&l)return l(r,!0);if(i)return i(r,!0);var d=new Error("Cannot find module '"+r+"'");throw d.code="MODULE_NOT_FOUND",d}var c=o[r]={exports:{}};t[r][0].call(c.exports,function(e){var o=t[r][1][e];return a(o||e)},c,c.exports,e,t,o,n)}return o[r].exports}for(var i="function"==typeof require&&require,r=0;r<n.length;r++)a(n[r]);return a}({1:[function(e,t,o){var n={};n.Google={MAPS_KEY:"AIzaSyAp7WgpI5MFyR1HgnGO8tHdjv8RVm_flQU",OAUTH_ID:"992073863488-a3107lj0prdiih05id9n065bnhocmpve.apps.googleusercontent.com"},n.API={URL:serverRoot+"api/v2/",GOOGLE_GEODECODE_URL:"https://maps.googleapis.com/maps/api/geocode/json?key="+n.Google.GEODECODE_KEY+"&latlng="},n.Iden={HIDDEN:"hidden",LOADING:"loading",SEARCH:"search"},n.ToiletImage={BATHROOM_MARKER:serverRoot+"mobile/assets/images/temp2.png"},void 0!==t&&(t.exports=n)},{}],2:[function(e,t,o){var n={};n.sanitize=function(e){var t=document.createElement("span");return t.appendChild(document.createTextNode(e)),t.innerHTML},void 0!==t&&(t.exports=n)},{}],3:[function(e,t,o){function n(e){$http(c.API.URL+"bathroom/vote/"+e+"/"+g.model.map.selectedBathroom.id).post({gid:g.model.user.guser.id,ukey:g.model.user.guser.token}).then(function(t){iqwerty.toast.Toast("Thank you for your contribution!");var o=JSON.parse(t);delete o.total_score,Object.keys(o).forEach(function(e){g.model.map.selectedBathroom[e]=o[e]}),g.model.map.selectedBathroom.myRating="up"===e?1:-1}).catch(function(){return iqwerty.toast.Toast("You must be logged in to vote")})}function a(){document.querySelector("."+c.Iden.LOADING).classList.remove(c.Iden.HIDDEN)}function i(){document.querySelector("."+c.Iden.LOADING).classList.add(c.Iden.HIDDEN)}function r(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:e,o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:h;"undefined"==typeof google&&setTimeout(function(){return r(e,o)},100),w=new google.maps.Map(document.getElementById(v),o),w.setCenter({lat:t.lat,lng:t.lng});var n=g.model.map.location,a=n.lat,i=n.lng,s=n.accuracy;m.addMyLocationMarker(w,{lat:a,lng:i},s)}function s(e){new google.maps.Marker({position:{lat:e.lat,lng:e.lng},icon:c.ToiletImage.BATHROOM_MARKER}).setMap(w)}function l(e){i(),g.model.view.panel.display.detail="true",g.model.view.panel.display.add="false",console.log(e),e.description=u.sanitize(e.description),Object.assign(g.model.map.selectedBathroom,e)}function d(e,t){$http(c.API.URL+"bathroom/query/id/"+e).get({vote:!0,gid:t}).then(function(e){g.model.map.selectedBathroom.myRating=JSON.parse(e).vote})}var c=e("../../../../assets/js/constants"),u=e("../../../../assets/js/util"),m=e("./mainmap"),g=e("./viewmodel"),p=e("./google"),f=t.exports,v="map-view-small",h={zoom:18,zoomControl:!0,disableDefaultUI:!0,draggable:!1,scrollwheel:!1,disableDoubleClickZoom:!0,streetViewControl:!0},w=void 0;f.openPanel=function(e){a(),m.openPanel().then(function(){$http(c.API.URL+"bathroom/get/id/"+e).cache().get().then(function(t){t=JSON.parse(t)[0],l(t),r({lat:t.lat,lng:t.lng}),s(t),void 0!==g.model.user.guser.id&&(d(e,g.model.user.guser.id),g.model.view.panel.display.delete=t.userid===g.model.user.guser.id)})})},f.closePanel=function(){m.closePanel(),w=null},f.addBathroom=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:g.model.map.instance.getCenter();if(!g.model.user.guser.token)return void iqwerty.snackbar.Snackbar("You are not logged in","Login",p.signIn,{settings:{duration:6e3}});m.openPanel(),i(),g.model.view.panel.display.detail="false",g.model.view.panel.display.add="true";var t=Object.assign({},h);t.draggable=!0;var o=g.model.map.location;r({lat:o.lat,lng:o.lng},{lat:e.lat(),lng:e.lng()},t),w.addListener("idle",function(){$http(c.API.URL+"geocode/get/coords/"+w.center.lat()+","+w.center.lng()).get().then(function(e){e=JSON.parse(e),g.model.view.panel.add.approx_address=e.results.shift().formatted_address})})},f.create=function(){var e=document.querySelector("#panel-view textarea.description");g.model.view.panel.add.submitDisabled=!0,$http(c.API.URL+"bathroom/create").post({gid:g.model.user.guser.id,ukey:g.model.user.guser.token,coords:w.center.lat()+","+w.center.lng(),desc:e.value}).then(function(){g.model.view.panel.add.submitDisabled=!1,e.value="",iqwerty.toast.Toast("Thank you for your contribution!"),f.closePanel(),m.getBathrooms()}).catch(function(){g.model.view.panel.add.submitDisabled=!1,iqwerty.snackbar.Snackbar("Sorry, there was an error. Try reloading the page?","Reload",function(){window.location.reload()})})},f.upvote=function(){n("up")},f.downvote=function(){n("down")}},{"../../../../assets/js/constants":1,"../../../../assets/js/util":2,"./google":4,"./mainmap":5,"./viewmodel":6}],4:[function(e,t,o){function n(e){if(e){document.getElementById(l).style.display="none";var t=s.model.user.guser;$http(r.API.URL+"login").post({gid:t.id,ukey:t.token})}else document.getElementById(l).style.display=""}function a(e){u=e;var t=e.getBasicProfile();if(t){var o=s.model.user.guser;o.token=u.getAuthResponse().id_token,o.name=t.getGivenName(),o.id=t.getId(),o.gpURL="https://plus.google.com/"+o.id,o.pic=t.getImageUrl(),o.token&&(s.model.view.guser.signedIn=!0),console.log(u,s.model.user.guser)}}function i(){gapi.signin2.render(l,{scope:"email profile",width:110,height:30,theme:"dark",onsuccess:d.loginSuccess,onfailure:d.loginFailure})}var r=e("../../../../assets/js/constants"),s=e("./viewmodel"),l="sign-in--google",d=t.exports,c=void 0,u=void 0;d.loadAuth=function(){gapi.load("auth2",function(){c=gapi.auth2.init({client_id:r.Google.OAUTH_ID,scope:"email profile"}),c.isSignedIn.listen(n),c.currentUser.listen(a),c.isSignedIn.get()&&c.signIn(),setTimeout(function(){return i()})})},d.signIn=function(){document.getElementById(l).children[0].click()},d.loginSuccess=function(){},d.loginFailure=function(){iqwerty.snackbar.Snackbar("Login failed","Try again",d.signIn,{settings:{duration:6e3}})},d.logout=function(){c.disconnect(),s.model.view.guser.signedIn=!1}},{"../../../../assets/js/constants":1,"./viewmodel":6}],5:[function(require,module,exports){function locationUnavailable(){iqwerty.toast.Toast("Geolocation is not supported on your device"),initBasicMap()}function locationAvailable(){return"geolocation"in navigator}function initBasicMap(){_map=new google.maps.Map(document.getElementById(MAP_VIEW),DEFAULT_MAP_OPTIONS),ViewModel.model.map.instance=_map,updateMapOnMoved()}function initMap(e){var t=e.coords,o=ViewModel.model.map;o.location={lat:t.latitude,lng:t.longitude,accuracy:t.accuracy};var n=Object.assign({},DEFAULT_MAP_OPTIONS);n.zoom=20,n.center={lat:o.location.lat,lng:o.location.lng},_map=new google.maps.Map(document.getElementById(MAP_VIEW),n),ViewModel.model.map.instance=_map,shell.addMyLocationMarker(_map,n.center,o.location.accuracy),updateMapOnMoved(),addBathroomOnClick()}function updateMapOnMoved(){_map.addListener("idle",shell.getBathrooms)}function addBathroomOnClick(){_map.addListener("rightclick",function(e){Bathroom.addBathroom(e.latLng)})}function attachBathrooms(e){var t=[],o=createInfoWindow();e.filter(function(e){return!_markers.find(function(t){return e.id===t.id})}).forEach(function(e){var n=new google.maps.Marker({position:{lat:e.lat,lng:e.lng},icon:Constants.ToiletImage.BATHROOM_MARKER,title:e.approx_address,animation:google.maps.Animation.DROP,id:e.id});n.setMap(_map),n.addListener("click",function(){o.open(_map,n),o.setContent(getInfoWindowContent(e))}),t.push(n)}),_markers.push.apply(_markers,t),_markerClusterer?_markerClusterer.addMarkers(t):_markerClusterer=new MarkerClusterer(_map,_markers,{imagePath:serverRoot+"mobile/assets/images/clusterer/m"})}function createInfoWindow(){return _infoWindow||(_infoWindow=new google.maps.InfoWindow),_infoWindow}function getInfoWindowContent(bathroom){var template='<div class="info-window flex flex--row">\r\n\t<div class="flex-child flex flex--column info-window--description">\r\n\t\t<div class="address" title="${bathroom.approx_address}">\r\n\t\t\tFree Pee near ${bathroom.approx_address}\r\n\t\t</div>\r\n\t\t<div class="description">\r\n\t\t\t${Util.sanitize(bathroom.description)}\r\n\t\t</div>\r\n\t</div>\r\n\t<div class="flex-child flex">\r\n\t\t<a class="button button--info-window" onclick="iqwerty.history.Push(\'bathroom/${bathroom.id}\');">more &raquo;</a>\r\n\t</div>\r\n</div>';return eval('`<div class="info-window flex flex--row">\r\n\t<div class="flex-child flex flex--column info-window--description">\r\n\t\t<div class="address" title="${bathroom.approx_address}">\r\n\t\t\tFree Pee near ${bathroom.approx_address}\r\n\t\t</div>\r\n\t\t<div class="description">\r\n\t\t\t${Util.sanitize(bathroom.description)}\r\n\t\t</div>\r\n\t</div>\r\n\t<div class="flex-child flex">\r\n\t\t<a class="button button--info-window" onclick="iqwerty.history.Push(\'bathroom/${bathroom.id}\');">more &raquo;</a>\r\n\t</div>\r\n</div>`')}var Constants=require("../../../../assets/js/constants"),Bathroom=require("./bathroom"),ViewModel=require("./viewmodel"),Util=require("../../../../assets/js/util"),shell=module.exports,MAP_VIEW="map-view",DEFAULT_MAP_OPTIONS={zoom:3,center:{lat:0,lng:0},disableDefaultUI:!0},_map=void 0,_markers=[],_markerClusterer=void 0,_infoWindow=null;shell.BaseStateController=function(){shell.closePanel()},shell.BathroomStateController=function(e){Bathroom.openPanel(e)},shell.openPanel=function(){var e=document.getElementById("panel"),t=document.getElementById("overlay");return e.classList.remove(Constants.Iden.HIDDEN),t.classList.remove(Constants.Iden.HIDDEN),new Promise(function(t){var o=function o(){e.removeEventListener("transitionend",o),t()};e.addEventListener("transitionend",o)})},shell.closePanel=function(){var e=document.getElementById("panel"),t=document.getElementById("overlay");e.classList.add(Constants.Iden.HIDDEN),t.classList.add(Constants.Iden.HIDDEN)},shell.getLocation=function(){var e=initMap,t=locationUnavailable,o={enableHighAccuracy:!1,timeout:1e4};if(!locationAvailable())return t(),!1;navigator.geolocation.getCurrentPosition(e,t,o)},shell.addMyLocationMarker=function(e,t,o){var n={url:serverRoot+"mobile/assets/images/location.png",size:new google.maps.Size(20,20),origin:new google.maps.Point(0,0),anchor:new google.maps.Point(10,10)};new google.maps.Marker({position:t,title:"My current location",icon:n}).setMap(e),new google.maps.Circle({clickable:!1,strokeColor:"#00838f",strokeWeight:1,fillColor:"#00838f",fillOpacity:.15,map:e,center:t,radius:o})},shell.getBathrooms=function(){var e=_map.getCenter();$http(Constants.API.URL+"bathroom/get/coords/"+e.lat()+","+e.lng()+","+_map.getZoom()+"z").get().then(function(e){e&&attachBathrooms(JSON.parse(e))})},shell.toggleSearch=function(){var e=document.getElementById(Constants.Iden.SEARCH);e.classList.toggle(Constants.Iden.HIDDEN),e.classList.contains(Constants.Iden.HIDDEN)||e.querySelector("input").focus()}},{"../../../../assets/js/constants":1,"../../../../assets/js/util":2,"./bathroom":3,"./viewmodel":6,fs:7}],6:[function(e,t,o){var n=e("../../../../assets/js/constants"),a=e("./mainmap"),i=t.exports;i.model={map:{selectedBathroom:{},search:{place:""},location:{},instance:null},user:{guser:{token:"",name:"",id:"",gpURL:"",pic:n.ToiletImage.BATHROOM_MARKER}},view:{guser:{signedIn:!1},panel:{display:{detail:"false",add:"false",delete:"true"},add:{approx_address:null,description:null,submitDisabled:!1}}}},i.template={bindBathroomData:function(){iqwerty.binding.Model({bathroom:i.model.map.selectedBathroom,search:i.model.map.search}),iqwerty.history.States({"":a.BaseStateController,"bathroom/:id":a.BathroomStateController},{base:serverRoot+"m/"})},bindToolbarData:function(){iqwerty.binding.Model({guser:i.model.user.guser,view:i.model.view})}}},{"../../../../assets/js/constants":1,"./mainmap":5}],7:[function(e,t,o){},{}],"iqwerty-freepee":[function(e,t,o){var n=e("../../../assets/js/constants"),a=e("./modules/mainmap"),i=e("./modules/bathroom"),r=e("./modules/google"),s=e("./modules/viewmodel");void 0!==t&&(t.exports={Constants:n,MainMap:a,Bathroom:i,Google:r,ViewModel:s})},{"../../../assets/js/constants":1,"./modules/bathroom":3,"./modules/google":4,"./modules/mainmap":5,"./modules/viewmodel":6}]},{},["iqwerty-freepee"]);