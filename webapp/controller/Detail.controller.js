sap.ui.define([
    "people/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter"
], function (Controller, JSONModel, MessageBox, MessageToast,Filter) {
    "use strict";

    return Controller.extend("people.controller.Detail", {
        // 초기화 메서드
        onInit: function () {
            // 'Detail' 라우트가 매칭될 때 _onRouteMatched 메서드가 호출되도록 설정
            this.getRouter().getRoute("Detail").attachMatched(this._onRouteMatched, this);
        },

        // 라우트 매칭 시 호출되는 메서드
        _onRouteMatched: function (oEvent) {
            // URL 파라미터에서 Uuid 값을 가져옴
            var oArgs = oEvent.getParameter("arguments");
            this.Uuid = oArgs.Uuid;
            // 데이터를 가져오는 메서드 호출
            this._getData();
        },

        // 데이터를 가져오는 메서드
        _getData: function () {
            var oBundle = this.getResourceBundle(); // 리소스 번들을 가져옴
            var oMainModel = this.getOwnerComponent().getModel(); // 메인 모델을 가져옴
            var oBuModel = this.getOwnerComponent().getModel("buseoData"); // 부서 데이터를 가져오는 모델
            var flag; // 편집 가능 여부를 나타내는 변수
            var msg; // 버튼에 표시될 텍스트
        
                // Uuid가 존재하는 경우 (수정 모드)
                if (this.Uuid) {
                    var oModel = this.getOwnerComponent().getModel();
                    var sPath = "/People(guid'" + this.Uuid + "')";
    
                    oModel.read(sPath, {
                        success: function (oData) {
                            if (oData) {
                                // 데이터 타입 변환
                                oData.Inyn = oData.Inyn === "Y";
                                oData.Maintel = oData.Maintel === "M" ? 0 : 1;
                                // 상세보기
                                var oNewModel = new JSONModel(oData);
                                this.getView().setModel(oNewModel, "newModel");
    
                                flag = false;
                                //수정 버튼 눌렀을 떄
                                msg = oBundle.getText("수정");
                                this.getView().setModel(
                                    new JSONModel({ editable: flag, buttonText: msg }), "editModel"
                                );
                                this.editFlag = flag;
    
                                // 부서 데이터를 가져옴
                                this._getODataRead(oBuModel, "/Buseo").done(function (aGetDataSel) {
                                aGetDataSel.unshift({ Bukey: "All", Butxt: "선택" });
                                this.getView().setModel(new JSONModel(aGetDataSel), "buModel");

                                // Buseo 데이터에서 Butxt와 일치하는 Bukey를 찾음
                                var selectedBukey = aGetDataSel.find(function (item) {
                                    return item.Butxt === oData.Buname;
                                });

                                if (selectedBukey) {
                                    oNewModel.setProperty("/Bukey", selectedBukey.Bukey);
                                } else {
                                    oNewModel.setProperty("/Bukey", "All");
                                }
                            }.bind(this)).fail(function () {
                                MessageBox.information("부서 조회를 실패하였습니다.");
                            });
                        } else {
                            MessageBox.error("해당 UUID에 해당하는 데이터를 찾을 수 없습니다.");
                        }
                    }.bind(this),
                    error: function () {
                        MessageBox.error("데이터를 가져오는 중 오류가 발생하였습니다.");
                    }
                });
            } else {
                // Uuid가 없는 경우 (새로운 데이터 입력 모드)
                var oData = {
                    Name: "",
                    Hiredate: "",
                    Buname: "",
                    Email: "",
                    Mobile: "",
                    Phone: "",
                    Inyn: true,
                    Maintel: 0 // 0 for "휴대전화", 1 for "내선전화"
                };
                var oNewModel = new JSONModel(oData);
                this.getView().setModel(oNewModel, "newModel");
                flag = true;
                msg = oBundle.getText("저장");

                this.getView().setModel(
                    new JSONModel({ editable: flag, buttonText: msg }), "editModel"
                );
                this.editFlag = flag;

                // 입사일을 오늘 날짜로 설정
                var oDatePicker = this.byId("hiredate");
                var oToday = new Date();
                var FormatDate = oToday.getFullYear() + '-' +
                    ('0' + (oToday.getMonth() + 1)).slice(-2) + '-' +
                    ('0' + oToday.getDate()).slice(-2);
                oDatePicker.setValue(FormatDate);
                
                // 부서 데이터를 가져옴
                this._getODataRead(oBuModel, "/Buseo").done(function (aGetDataSel) {
                    aGetDataSel.unshift({ Bukey: "All", Butxt: "선택" });
                    this.getView().setModel(new JSONModel(aGetDataSel), "buModel");
                    this.getView().setModel(new JSONModel({ selectedBukey: "All" }));
                }.bind(this)).fail(function () {
                    // 부서 조회 실패 시 정보 메시지 박스 표시
                    MessageBox.information("부서 조회를 실패하였습니다.");
                });
            }
        },

        // 부서 선택 시 호출되는 메서드
        onSelectChange: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem"); // 선택된 아이템
            var selectedText = oSelectedItem.getText(); // 선택된 아이템의 텍스트

            // 새로운 모델에 부서명을 설정
            var oModel = this.getView().getModel("newModel");
            oModel.setProperty("/Buname", selectedText);
        },

        // 홈으로 돌아가는 메서드
        onHome: function () {
            this.navTo("Main", {}); // 메인 화면으로 이동
        },

        // 저장 버튼 클릭 시 호출되는 메서드
        onSave: function () {
            if (this.editFlag) {
                var oDataModel = this.getOwnerComponent().getModel(); // 데이터 모델
                var oNewModel = this.getView().getModel("newModel"); // 새로운 모델
                var oData = oNewModel.getData(); // 새로운 모델의 데이터

                // 필수 입력 사항 체크
                if (!oData.Name || !oData.Buname || !oData.Hiredate) {
                    MessageToast.show("성명, 부서명, 입사일은 필수 입력 사항입니다.");
                    return;
                }

                // 이메일 형식 체크
                if (!oData.Email.includes('@')) {
                    MessageToast.show("이메일 형식을 맞춰주세요.");
                    return;
                }

                // 데이터 형식 변환
                oData.Inyn = oData.Inyn === true ? "Y" : "N";
                oData.Maintel = oData.Maintel === 0 ? "M" : "P";
                delete oData.Bukey;

                // Uuid가 있는 경우 (수정 모드)
                if (this.Uuid) {
                    var param = "/People(guid'" + this.Uuid + "')";
                    this._getODataUpdate(oDataModel, param, oData).done(function () {
                        MessageToast.show("데이터가 성공적으로 업데이트되었습니다.");
                        this.navTo("Main", {});
                    }.bind(this)).fail(function () {
                        MessageBox.error("데이터 업데이트를 실패하였습니다.");
                    });
                } else {
                    // Uuid가 없는 경우 (새로운 데이터 저장 모드)
                    this._getODataCreate(oDataModel, "/People", oData).done(function () {
                        MessageToast.show("데이터가 성공적으로 저장되었습니다.");
                        this.navTo("Main", {});
                    }.bind(this)).fail(function () {
                        MessageBox.error("데이터 저장을 실패하였습니다.");
                    });
                }
            } else {
                var oBundle = this.getResourceBundle();
                var msg = oBundle.getText("저장");

                this.getView().setModel(
                    new JSONModel({ editable: true, buttonText: msg }), "editModel"
                );
                this.editFlag = true;
            }
        },

        // 초기화 버튼 클릭 시 호출되는 메서드
        onClear: function () {
            var oModel = this.getView().getModel("newModel");
            oModel.setData({
                Name: "",
                Hiredate: "",
                Buname: "",
                Email: "",
                Mobile: "",
                Phone: "",
                Inyn: true,
                Maintel: 0 // 휴대전화로 초기화
            });

            var oToday = new Date();
            var FormatDate = oToday.getFullYear() + '-' +
                ('0' + (oToday.getMonth() + 1)).slice(-2) + '-' +
                ('0' + oToday.getDate()).slice(-2);
            this.byId("hiredate").setValue(FormatDate);

            this.getView().getModel().setProperty("/selectedBukey", "All");
            MessageToast.show("데이터가 초기화되었습니다.");

            this.byId("Inyn").setSelected(true);
            this.byId("Maintel").setSelectedIndex(0);
        }
    });
});
