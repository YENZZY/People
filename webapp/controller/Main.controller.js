sap.ui.define([
    "people/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/export/library',
    'sap/ui/export/Spreadsheet',
    'sap/ui/unified/FileUploader',
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Text"
],
function (Controller, JSONModel, MessageBox, Filter, FilterOperator, exportLibrary, Spreadsheet, FileUploader, ValueHelpDialog, Column, Label ,Text) {
    "use strict";
    var EdmType = exportLibrary.EdmType;

    return Controller.extend("people.controller.Main", {
        // onInit : 컨트롤러가 초기화될 때 호출
        onInit: function () { 
            this.getRouter().getRoute("Main").attachMatched(this._onRouteMatched, this) // 라우터 설정, Main 페이지 로드 될때 메소드 호출, attachMatched : 라우트가 매칭될 때 실행할 콜백 함수 설정
            // return this : 메서드 체이닝, 여러 메서드를 연속적으로 호출
            
            this._initializeFilterModel();
        },

        // 필터 모델 생성
        _initializeFilterModel: function() {
            var oFilterModel = new JSONModel({
                Name: "",          // 이름 필터 초기값
                BuNames: [],       // 부서명 필터 배열 초기값
                Hiredate: null     // 입사일 필터 초기값
            });
            this.setModel(oFilterModel, "filterModel");
        },

        // 해당 라우트가 매칭되면 _getData 메소드를 호출
        _onRouteMatched: function () {
            
            this._getData();
        },

        //인사 기록 조회 메인 모델에서 데이터를 읽어와 JSON 모델로 설정, 데이터 읽기 실패 시 메시지 박스를 표시
        _getData: function () {
            var oMainModel = this.getOwnerComponent().getModel(); // 메인 모델 가져오기
            var oBuModel = this.getOwnerComponent().getModel("buseoData"); // 부서명 가져오기
            
            // 데이터 읽기 성공 시 JSON 모델로 설정 , JSON 모델 객체를 생성한 후, 이 데이터를 모델에 설정
            this._getODataRead(oMainModel, "/People").done(
                function(aGetData){
                    this.setModel(new JSONModel(aGetData), "empModel");
                    var resultCount = aGetData.length !== null ? aGetData.length : 0;
                    this.getModel("empModel").setProperty("/resultCount", resultCount);
                    
                    // DatePicker id 가져옴 (view에서 설정) 
                    var oDatePicker = this.byId("hiredate");

                    // 현재 날짜 가져오기
                    var oToday = new Date();

                    // 날짜 형식을 yyyy-MM-dd로 변환
                    var sFormattedDate = oToday.getFullYear() + '-' +
                                        ('0' + (oToday.getMonth() + 1)).slice(-2) + '-' +
                                        ('0' + oToday.getDate()).slice(-2);

                    // DatePicker의 값을 설정
                    oDatePicker.setValue(sFormattedDate);

                }.bind(this)).fail(
                    function() {
                        MessageBox.information("데이터 조회를 실패하였습니다.");
                
                    }).always(function (){
                        // 항상 실행되는 코드
            });
            
            this._getODataRead(oBuModel, "/Buseo").done(
            function(aGetDataSel) {
                // "선택" 항목 추가
                aGetDataSel.unshift({ Bukey: "All", Butxt: "선택" });
                this.setModel(new JSONModel(aGetDataSel), "buModel");

                // debugger;
            }.bind(this)).fail(
                function() {

                    MessageBox.information("부서 조회를 실패하였습니다.");
                });
        },

        onCreate : function (){
            this.navTo("Detail",{}) //이동하는 페이지, 파라미터 값
        },

        // 대표전화 설정 (0:Mobile 1:Phone)
        formatMaintel: function(sMaintel, sMobile, sPhone) {
            var oMModel = this.getOwnerComponent().getModel();
            if (sMaintel === "M") {
                return sMobile;
            } else if (sMaintel === "P") {
                return sPhone;
            } else {
                return "";
            }
        },

        // 데이터 조회 onFind
onFind: function () {
    // 필터 배열 생성
    var aFilters = [];

    // 이름 필터 추가
    var sName = this.getView().getModel("filterModel").getProperty("/Name");
    if (sName) {
        aFilters.push(new Filter("Name", FilterOperator.Contains, sName));
    }
    
    // 부서명 필터 추가
    var aBuNames = this.getView().getModel("filterModel").getProperty("/BuNames");
    if (aBuNames && aBuNames.length > 0) {
        // 중복된 부서명을 포함하여 필터 추가
        aBuNames.forEach(function(sBuName) {
            aFilters.push(new Filter("Buname", FilterOperator.EQ, sBuName));
        });
    }

    // 입사일 필터 추가
    var sHiredate = this.getView().getModel("filterModel").getProperty("/Hiredate");
    if (sHiredate) {
        aFilters.push(new Filter("Hiredate", FilterOperator.LE, sHiredate));
    }

    // 모든 필터를 AND 조건으로 결합하여 최종 필터 생성
    var oFinalFilter = new Filter({
        filters: aFilters,
        and: true
    });

    // 필터 모델에 필터링할 값을 설정
    var oFilterModel = this.getView().getModel("filterModel");
    oFilterModel.setProperty("/Name", sName);
    oFilterModel.setProperty("/Buname", aBuNames);
    oFilterModel.setProperty("/Hiredate", sHiredate);

    // 테이블과 바인딩을 가져와서 필터를 적용
    var oTable = this.byId("empTable");
    var oBinding = oTable.getBinding("rows");
    oBinding.filter(oFinalFilter);
},

        
            // 부서명 필터링 Select 컨트롤에서 선택된 부서명의 키 가져오기
            // var sBunameKey = this.getView().getModel("empModel").getProperty("/Buname"); // 선택된 부서명의 키를 가져오기 위해 empModel에서 Buname 값 가져옴
        
            // if (sBunameKey && sBunameKey !== "All") { // "All"이 아닌 경우에만 필터링
            //     var aBuModelData = this.getView().getModel("buModel").getData(); //가져온 키와 일치하는 부서명을 buModel에서 가져옴
            //     var sBuname = aBuModelData.find(function(item) {
            //         return item.Bukey === sBunameKey;
            //     }).Butxt; // 선택된 부서명의 키에 해당하는 부서명을 가져옴
        
            //     oFilter.aFilters.push(new Filter("Buname", FilterOperator.EQ, sBuname)); //부서명을 사용하여 필터를 설정
            // }
        
         // 데이터 이동 함수 , 이벤트가 발생한 테이블 행의 데이터를 가져와 해당 페이지로 네비게이션
         onMove: function(oEvent) {
            //debugger;
            var getData = this.getModel("empModel").getData();
            var index = oEvent.getSource().getParent().getParent().getIndex();
            var oRowData = getData[index];
            this.navTo("Detail",{Uuid : oRowData.Uuid});
            
        },
         // 삭제 테이블에서 선택된 행의 데이터를 삭제하고, 삭제 후 데이터를 다시 가져옴
         onDelete: function (oEvent) {
            var oTable = this.byId("empTable");
            var aSelectedIndices = oTable.getSelectedIndices();
            var getData = this.getModel("empModel").getData();
            var oMainModel = this.getOwnerComponent().getModel();

            if (aSelectedIndices.length === 0) {
                MessageBox.information("선택된 항목이 없습니다.");
                return;
            }

            // 선택된 행의 데이터를 삭제하는 함수
            var aDeletePromises = aSelectedIndices.map(function(index) {
                var oRowData = getData[index]; // 선택된 각 행의 데이터를 가져옴
                var param = "/People(guid'" + oRowData.Uuid + "')"; // OData 삭제 요청을 위한 URL 파라미터 생성
                return this._getODataDelete(oMainModel, param); // OData 삭제 요청을 비동기로 수행하고, 해당 프로미스를 반환
            }.bind(this));

            // 모든 삭제 요청이 완료되면 실행되는 코드
            Promise.all(aDeletePromises).then(function() {
                this._getData(); // 데이터 다시 가져오기
                MessageBox.success("삭제 성공");
            }.bind(this)).catch(function() {
                MessageBox.error("삭제 실패");
            }).finally(function() {
                // 항상 실행되는 코드
            });
        },

        //엑셀 파일 다운로드
        onExport : function () {
            var aCols, oRowBinding, oSettings, oSheet, oTable;
        
        // 테이블 객체가 이미 존재하지 않으면 가져옴
         if (!this._oTable) {
            this._oTable = this.byId('exportTable');
        }
        // 테이블과 바인딩을 가져옴
         oTable = this._oTable;
         oRowBinding = oTable.getBinding('items');
         // 컬럼 설정을 생성
         aCols = this.createColumnConfig();

        // 엑셀 파일 설정을 정의
         oSettings = {
            workbook: {
               columns: aCols,
               hierarchyLevel: 'Level' // 계층 구조 레벨 설정
            },
            dataSource: oRowBinding, // 데이터 소스 설정
            fileName: '인사 관리 데이터.xlsx', // 다운로드 파일 이름 설정
            worker: false // 워커 사용 여부 (테이블 안 보이게)
         };

        // 엑셀 파일을 생성하고 다운로드
         oSheet = new Spreadsheet(oSettings);
         oSheet.build().finally(function() {
            oSheet.destroy();
         });
        },

        //엑셀파일로 데이터 내보내기
        createColumnConfig: function() {
         var aCols = [];
            // 컬럼 라벨과 속성을 정의
            var labels = ['Name', 'Buname', 'Mobile', 'Phone', 'Email', 'Hiredate', 'Inyn'];
            var properties = ['Name', 'Buname', 'Mobile', 'Phone', 'Email', 'Hiredate', 'Inyn'];
        
            // 라벨과 속성을 매핑하여 컬럼 설정 배열을 생성
            labels.map((label ,index)=>{
                aCols.push({
                    label: label,
                    property: properties[index],
                    type: EdmType.String,
                });
            })
            return aCols; // 컬럼 설정 배열 반환
        },

        // 파일 업로드 //아직 미완성
        onUpload: function (e) {
            this._import(e.getParameter("files") && e.getParameter("files")[0]);
        },

        _import: function (file) {
            var that = this;
            var excelData = {};
            if (file && window.FileReader) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var data = e.target.result;
                    var workbook = XLSX.read(data, {
                        type: 'binary'
                    });
                    workbook.SheetNames.forEach(function (sheetName) {

                        excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                        
                    });
                    
                    var oExcelModel = that.setModel(new JSONModel(), "excelModel");
                    var excelOk = that.getModel("excelModel");
                    console.log(excelOk);
                    // 데이터 모델에 추가
                    if (excelOk) {
                        excelOk.setData(excelData);
                    };

                    var oMainModel = that.getOwnerComponent().getModel();

                    var oExcelData = excelOk.getData();

                    for(var i=0; i < oExcelData.length; i++){
                        var oData = oExcelData[i];

                        that._getODataCreate(oMainModel, "/People" , oData).fail(function() {
                            MessageBox.information("Create Fail");
                        });
                    }
                    that._updateEmpModelData();
                }
                reader.readAsBinaryString(file);
            }
        },
        _updateEmpModelData: function(data) {
            var oMainModel = this.getOwnerComponent().getModel();
        },
        //파일 업로드 끝
        
        // findBuNameByBuKey: function(sBuKey) {
        //     var aBuModelData = this.getModel("buModel").getData();
        //     var oBuItem = aBuModelData.find(function(item) {
        //         return item.Bukey === sBuKey;
        //     });
        //     return oBuItem ? oBuItem.Butxt : ""; // 부서명이 없는 경우 빈 문자열 반환
        // },

        // value help 창이 열릴 때 호출되는 함수
        onValueHelpRequest: function () {
            // value help dialog가 없으면 새로 생성
            if (!this._oValueHelpDialog) {
                // ValueHelpDialog를 생성하고 필요한 속성들을 설정
                this._oValueHelpDialog = new ValueHelpDialog({
                    title: "부서명", // 다이얼로그 제목
                    supportMultiselect: true, // 다중 선택 지원
                    supportRanges: false, // 범위 선택 지원 안함
                    key: "Bukey", // 키 필드
                    descriptionKey: "Butxt", // 설명 필드
                    // 확인 버튼을 눌렀을 때 호출되는 함수
                    ok: function (oEvent) {
                        var aSelectedItems = oEvent.getParameter("tokens");
                        this.byId("selectBuname").setTokens(aSelectedItems);
                        this._oValueHelpDialog.close(); // 다이얼로그 닫기
                    }.bind(this),
                    // 취소 버튼을 눌렀을 때 호출되는 함수
                    cancel: function () {
                        this._oValueHelpDialog.close(); // 다이얼로그 닫기
                    }.bind(this),
                });
        
                // 다이얼로그의 테이블에 부서 키와 부서명 컬럼 추가
                var oTable = this._oValueHelpDialog.getTable();
                oTable.addColumn(new Column({
                    label: new Label({ text: "부서 키" }),
                    template: new Text({ text: "{Bukey}" })
                }));
                oTable.addColumn(new Column({
                    label: new Label({ text: "부서명" }),
                    template: new Text({ text: "{Butxt}" })
                }));
        
                // 부서 데이터를 가져오는 함수 호출
                this._getBuData();
            } else {
                // 이미 다이얼로그가 존재하면 부서 데이터만 다시 가져옴
                this._getBuData();
            }
            
            // 다이얼로그 열기
            this._oValueHelpDialog.open();
        },
        
        // 부서 데이터를 가져오는 함수
        _getBuData: function () {
            // buseoData 모델을 가져옴
            var oBuModel = this.getOwnerComponent().getModel("buseoData");
            // OData read 요청을 통해 부서 데이터를 가져옴
            oBuModel.read("/Buseo", {
                success: function (oData) {
                    // 데이터를 성공적으로 가져온 경우
                    var aBuData = oData.results;
                    var oTable = this._oValueHelpDialog.getTable();
                    // 가져온 데이터를 JSON 모델로 설정
                    oTable.setModel(new JSONModel(aBuData));
                    // 테이블에 데이터 바인딩
                    oTable.bindRows("/");
                    // 다이얼로그 업데이트
                    this._oValueHelpDialog.update();
                }.bind(this),
                error: function () {
                    // 데이터를 가져오는 데 실패한 경우 에러 메시지 표시
                    sap.m.MessageBox.error("부서 데이터를 가져오는 데 실패했습니다.");
                }
            });
        }
    });
});







