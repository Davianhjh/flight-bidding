$(function () {
    var formdata = [];
    $.ajax({
        url: '/adminInfo',
        type: 'GET',
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

                    formdata.push(formitem);
                })
            }

        },
        error: function(data) {
            alert('账号错误,请重新登录!'); //or whatever
            location.href = "/";
        }
    });

    var Main;
    Main = {
        data() {
            return {
                tableData : formdata,
                dialogFormVisible: false,
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

                $.ajax({
                    url: '/setAuctionFlights',
                    type: 'POST',
                    datatype: "json",
                    beforeSend: function (request) {
                        request.setRequestHeader("Agi-token", localStorage.agiToken);
                    },
                    data: {
                        "flights": [                          //航班号数组（支持批量设置）
                            {
                                "flight": this.form.flight,
                                "date": this.form.date,
                            }
                        ],
                        "type": this.form.region,                            //竞拍类型（1,2,3,4,5）
                        "price": this.form.price,                         //竞拍底价（512）
                        "seat": this.form.seat                      //竞拍座位数（可选）
                    },
                    success: function(respones){
                        if (respones.result == "1" && respones.repeat == "0" && respones.status == "1") {
                            alert("设置成功");
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