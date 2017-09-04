$(function () {
    var formdata = [];
    var totalcell;

    (function test(){
        $.ajax({
        url: '/adminInfo',
        type: 'GET',
        async: false,
        beforeSend: function (request) {
            request.setRequestHeader("Agi-token", localStorage.agiToken);
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
                    // 获取竞拍状态
                    switch (item.auctionState) {
                        case "-1": {
                            // console.log("未设置");
                            formitem.jpauctionState = "未设置";
                            break;
                        }
                        case "1": {
                            // console.log("进行中");
                            formitem.jpauctionState = "进行中";
                            break;
                        }
                        case "2": {
                            // console.log("已结束");
                            formitem.jpauctionState = "已结束";
                            break;
                        }
                        default: {
                            // console.log("未设置");
                            formitem.jpauctionState = "未设置";
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
                totalcell = formdata.length;
            }

        },
        error: function(data) {
            alert('账号错误,请重新登录!'); //or whatever
            location.href = "/";
        }
    });
    })();

    

    var Main;
    Main = {
        data() {
            return {
                isedit: false,
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
            filterTag(value, row) {
                console.log("debug here!!!" + value + "  and  " + row.type);
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
                console.log(index, row.flight, row.date);
                location.href = "/result#" + row.flight + "$" + row.date;
            },
            clickEdit(index, row) {
                this.dialogFormVisible = true;
                console.log(index, row);
                console.log(row.date, row.flight);
                this.form.date = row.date;
                this.form.flight = row.flight;
            },
            handleSubmit() {
                console.log(this.form.region);
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
                        "seat": this.form.seat                      //竞拍座位数（可选）
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
                                    flight: context.form.flight,
                                    seatnum: context.form.seat,
                                    type: context.form.region,
                                    date: context.form.date,
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