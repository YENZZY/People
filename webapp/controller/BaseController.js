sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/Filter",
	"sap/m/MessageToast",
	"sap/ui/model/Sorter",
	"sap/ui/model/json/JSONModel"
], function (Controller, History, Filter, MessageToast, Sorter, JSONModel) {
    "use strict";

    return Controller.extend("money.controller.BaseController", {
        /**
         * Convenience method for accessing the router in every controller of the application.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter : function () {
            return this.getOwnerComponent().getRouter();
        },

        /**
         * Convenience met _getData: function () {
            var oBundle = this.getResourceBundle(); // 리소스 번들을 가져옴
            var oMainModel = this.getOwnerComponent().getModel(); // 메인 모델을 가져옴
            var oBuModel = this.getOwnerComponent().getModel("buseoData"); // 부서 데이터를 가져오는 모델
            var flag; // 편집 가능 여부를 나타내는 변수
            var msg; // 버튼에 표시될 텍스트
            var oDetailData = oMainModel.getData();

            // Uuid가 존재하는 경우 (수정 모드)
            if (this.Uuid) {
                // UUID 값과 일치하는 데이터 필터링
                var filteredData = oDetailData.filter(function(item) {
                    return item.UUID === this.Uuid;
                }.bind(this));
                 console.log(filteredData);
                // 필터링된 데이터가 존재하는지 확인
                if (filteredData.length > 0) {
                    // 필터링된 데이터로 새로운 JSON 모델 생성
                    var oNewModel = new JSONModel(filteredData[0]);
                    // 새로운 모델을 뷰에 설정
                    this.getView().setModel(oNewModel, "newModel");
                } else {
                    // 해당 UUID에 해당하는 데이터가 없는 경우
                    MessageBox.error("해당 UUID에 해당하는 데이터를 찾을 수 없습니다.");
                }
            } hod for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel : function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model in every controller of the application.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel : function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Convenience method for getting the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle : function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the list route.
         * @public
         */
        onNavBack : function() {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line fiori-custom/sap-no-history-manipulation
                history.go(-1);
            } 
        },

        _getODataRead : function(oModel, readContext, aFilter, oParameters){
			var deferred = $.Deferred();
			var param = {
				ReadContext : readContext || "",
				Parameters : oParameters || null,
				Filter : aFilter || []
			};
			oModel.read(param.ReadContext,{
				urlParameters: param.Parameters,
				filters : param.Filter,
				success : function(oReturn){
					var aResult = oReturn.results;
			    	deferred.resolve(aResult);
				},
				error: function(oError) {
			    	deferred.reject(oError);
					try{
						var oResponseTextData = JSON.parse(oError.responseText);
						MessageToast.show(oResponseTextData.error.message.value);
					}catch(e){
						MessageToast.show(oError.message + "_" + oError.statusCode);
					}
				}
			});
			
			return deferred.promise();
		},
        
		_getODataDelete: function(oModel, readContext){
			var deferred = $.Deferred();
			
			oModel.remove(readContext,{
				success : function(oReturn){
			    	deferred.resolve(oReturn);
				},
				error: function(oError) {
			    	deferred.reject(oError);
					try{
						var oResponseTextData = JSON.parse(oError.responseText);
						MessageToast.show(oResponseTextData.error.message.value);
					}catch(e){
						MessageToast.show(oError.message + "_" + oError.statusCode);
					}
				}
			});
			
			return deferred.promise();
		},

		_getODataCreate : function(oModel, readContext, oData){
			var deferred = $.Deferred();
			
			oModel.create(readContext, oData,{
				success : function(oReturn){
					var aResult = oReturn.results;
			    	deferred.resolve(oReturn, aResult);
				},
				error: function(oError) {
					deferred.reject(oError);				
				}
			});
			
			return deferred.promise();

        },

		_getODataUpdate : function(oModel, updateContext, oData){
			var deferred = $.Deferred();
		
			oModel.update(updateContext, oData,{
				merge: true, // This is for PATCH, if you want to use PUT set this to false
				success : function(oReturn){
					deferred.resolve(oReturn);
				},
				error: function(oError) {
					deferred.reject(oError);
					try{
						var oResponseTextData = JSON.parse(oError.responseText);
						MessageToast.show(oResponseTextData.error.message.value);
					}catch(e){
						MessageToast.show(oError.message + "_" + oError.statusCode);
					}
				}
			});
		
			return deferred.promise();
		},

		navTo: function (psTarget, pmParameters) {
			this.getRouter().navTo(psTarget, pmParameters);
		},

        setProperty: function (sModelName, sPropertyName, value) {
            this.getModel(sModelName).setProperty(`/${sPropertyName}`, value);
        }

    });

});