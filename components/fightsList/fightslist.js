$(function () {
    var formdata = [];
    var totalcell;
    var currentStage = "1";

    var loaddata = function(stage){
        // 初始化,清空数据
        formdata = [];
        totalcell = 0;

        $.ajax({
        // url: '/adminInfo',
        url: '/stageList',
        type: 'GET',
        async: false,
        beforeSend: function (request) {
            request.setRequestHeader("Agi-token", localStorage.agiToken);
        },
        data:{
            "stage": stage,
        },
        success: function(data){
            if (data.result == 1) {
                data.flights.forEach(function (item) {
                    var formitem = {};
                    formitem.date = item.date;
                    formitem.flight = item.flight;
                    formitem.origin = item.origin;
                    formitem.destination = item.destination;
                    formitem.departure = item.departure;
                    formitem.landing = item.landing;
                    formitem.type = item.type;
                    // 获取竞拍状态
                    // console.log("状态" + item.auctionState);
                    switch (item.auctionState) {
                        case "-1": {
                            // console.log("未设置");
                            formitem.jpauctionState = "未设置";
                            formitem.operate = false;
                            break;
                        }
                        case "1": {
                            // console.log("进行中");
                            formitem.jpauctionState = "进行中";
                            formitem.operate = true;
                            break;
                        }
                        case "2": {
                            // console.log("已结束");
                            formitem.jpauctionState = "已结束";
                            formitem.operate = true;
                            break;
                        }
                        default: {
                            // console.log("未设置");
                            formitem.jpauctionState = "未设置";
                            formitem.operate = false;
                            break;
                        }
                    };
                    // 获取竞拍策略
                    switch (item.type) {
                        case "-1": {
                            // console.log("未设置");
                            formitem.jptype = "未设置";
                            break;
                        }
                        case "1": {
                            // console.log("第一价");
                            formitem.jptype = "第一价";
                            break;
                        }
                        case "2": {
                            // console.log("第二价");
                            formitem.jptype = "第二价";
                            break;
                        }
                        case "3": {
                            // console.log("热度竞拍");
                            formitem.jptype = "热度竞拍";
                            break;
                        }
                        case "4": {
                            // console.log("超售竞拍");
                            formitem.jptype = "超售竞拍";
                            break;
                        }
                        case "5": {
                            // console.log("提前竞拍");
                            formitem.jptype = "提前竞拍";
                            break;
                        }
                        case "6": {
                            // console.log("幸运竞拍");
                            formitem.jptype = "幸运竞拍";
                            break;
                        }                                                                                            
                        default: {
                            // console.log("未设置");
                            formitem.jptype = "未设置";
                            break;
                        }                        
                    }
                    formdata.push(formitem);
                })
                // 获取总共条数
                totalcell = formdata.length;
            }

        },
        error: function(data) {
            alert('账号错误,请重新登录!'); //or whatever
            location.href = "/";
        }
    });
    }

    loaddata(currentStage);

    var Main;
    Main = {
        data() {
            return {
                stage:"1",
                activeIndex: "1", // 当前激活菜单的 index
                isedit: false,
                // isEditButton: formdata.isshow, // 编辑按钮是否可以点击
                currentPage: 1,
                searchValue: "",
                tableData : formdata,
                dialogFormVisible: false,
                totalValue: totalcell,
                seatplaceholder: "请输入竞拍的座位数(可选)",
                priceplaceholder: "请输入竞拍底价",
                form: {
                    date:'',
                    flight:'',
                    price: '',
                    region: '',
                    seat:''
                },
                formLabelWidth: '100px'
            };
        },
        methods: {
            reflash(){
                // console.log(this.stage);
                loaddata(this.stage);
                this.tableData = formdata;
                this.totalValue = totalcell;
            },
            handleSelect(key, keyPath) {
                var context = this;
                switch (key) {
                    case "1": {
                        loaddata("1");
                        context.tableData = formdata;
                        context.totalValue = totalcell;
                        context.stage = "1";
                        break;
                    }
                    case "2": {
                        loaddata("2");
                        context.tableData = formdata;
                        context.totalValue = totalcell;
                        context.stage = "2";
                        console.log(context.stage);
                        break;
                    }
                    case "3": {
                        loaddata("3");
                        context.tableData = formdata;
                        context.totalValue = totalcell;
                        context.stage = "3";
                        break
                    }
                    default: {
                        console.log("缺省设置为提前竞拍");
                        loaddata("1");
                        context.tableData = formdata;
                        context.totalValue = totalcell;
                        context.stage = "1";
                        break;
                    }
                }
            },
            filterTag(value, row) {
                // console.log("debug here!!!" + value + "  and  " + row.type);
            },
            formchange() {
                var context = this;
                if (context.form.region == 6) {
                    context.priceplaceholder = "幸运竞拍底价(可选)",
                    context.seatplaceholder = "幸运竞拍目前只支持一个座位",
                    context.isedit = true;
                } else {
                    context.priceplaceholder = "请输入竞拍底价",
                    context.seatplaceholder = "请输入竞拍的座位数(可选)",
                    context.isedit = false;
                }
            },
            search() {
                var context = this;       
                var searchArry = formdata.filter(function (elem) {
                    var tmpStr = JSON.stringify(elem);
                    return (tmpStr.indexOf(context.searchValue) >= 0);
                });
                context.tableData = searchArry;
            },
            clickCheck(index, row) {
                // console.log(index, row.flight, row.date, this.stage, row.type);
                location.href = "/result#" + row.flight + "$" + row.date + "$" + this.stage + "$" + row.type;
            },
            clickEdit(index, row) {
                this.dialogFormVisible = true;
                this.form.date = row.date;
                this.form.flight = row.flight;
            },
            handleSubmit() {
                // console.log(this.form.region);
                this.dialogFormVisible = false;
                var context = this;

                // 选择幸运抽奖座位数为1
                if (this.form.region == 6) {
                    this.form.seat = 1;
                } 

                $.ajax({
                    url: '/setAuctionFlights',
                    type: 'POST',
                    datatype: "json",
                    beforeSend: function (request) {
                        request.setRequestHeader("Agi-token", localStorage.agiToken);
                    },
                    // async: false,
                    data: {
                        "flights": [                          //航班号数组（支持批量设置）
                            {
                                "flight": this.form.flight,
                                "date": this.form.date,
                            }
                        ],
                        "type": this.form.region,                   //竞拍类型（1,2,3,4,5）
                        "price": this.form.price,                   //竞拍底价（512）
                        "seat": this.form.seat,                      //竞拍座位数（可选）
                        "stage": this.stage,                        // 竞拍的阶段
                    },
                    success: function(respones){
                        if (respones.result == "1" && respones.repeat == "0" && respones.status == "1") {
                            var starturl = "";

                            // 发送请求，开始竞拍策略
                            if (context.form.region == 6) { // 开始幸运竞拍
                                starturl = "/startLottery";
                            } else {
                                starturl = "/startAuction";
                            }

                            $.ajax({
                                url: starturl,
                                type: 'POST',
                                datatype: 'json',
                                beforeSend: function (request) {
                                    request.setRequestHeader("Agi-token", localStorage.agiToken);
                                },
                                data: {
                                    "flight": context.form.flight,
                                    "seatnum": context.form.seat,
                                    "type": context.form.region,
                                    "date": context.form.date,
                                    "stage": context.stage,
                                },
                                success: function(res) {
                                    console.log("竞拍开始");
                                    alert("设置成功");
                                },
                                error: function(res) {
                                    console.log("竞拍没有开始");
                                    alert("设置失败");
                                }
                            });
                        } else {
                            alert("设置失败");
                        }
                        console.log(respones);
                    },
                    error: function(respones) {
                        alert('账号错误,请重新登录!'); //or whatever
                        location.href = "/";
                    }
                });
            },
        }
    };
    var Ctor = Vue.extend(Main)
    new Ctor().$mount('#app')

})