

$(function () {
    // console.log(location.hash.substr(1));
    var dataStr = location.hash.substr(1);
    var paramData = dataStr.split("$");
    console.log(paramData[0], paramData[1], paramData[2], paramData[3]);
    var formdata = {};

    $.ajax({
        url: '/consoleResult',
        type: 'POST',
        datatype: "json",
        async: false,
        beforeSend: function (request) {
            request.setRequestHeader("Agi-token", localStorage.agiToken);
        },
        data: {
                flight:paramData[0],
                date:paramData[1],
                stage:paramData[2],
                type:paramData[3]     
                },
        success: function(data){
            console.log(data);
            if (data.result == 1) {
                formdata = data;
                
                if (data.seat < 0) {
                    formdata.seat = 0;
                }
                if (data.basePrice < 0) {
                    formdata.basePrice = 0;
                }
                switch (data.auctionState) { // 获取状态信息
                    case 0 :{
                        formdata.status = "未开始";
                        break;
                    }
                    case 1 :{
                        formdata.status = "正在进行";
                        break;
                    }
                    case 2 :{
                        formdata.status = "已结束";
                        break;
                    }
                    default:{
                        formdata.status = "未设置";
                        break;
                    }
                };
                switch (data.auctionType) { // 获取竞拍类型
                    case 1 :{
                        formdata.type = "第一价";
                        break;
                    }
                    case 2 :{
                        formdata.type = "第二价";
                        break;
                    }
                    case 3 :{
                        formdata.type = "热力竞拍";
                        break;
                    }
                    case 4 :{
                        formdata.type = "超售竞拍";
                        break;
                    }
                    case 5 :{
                        formdata.type = "提前竞拍";
                        break;
                    }
                    case 6 :{
                        formdata.type = "幸运竞拍";
                        formdata.isshow = true;
                        break;
                    }                    
                    default:{
                        formdata.type = "未设置";
                        break;
                    }
                };
                if (data.startTime == -1) {
                    formdata.startTime = "未设置";
                }
            } else {
                alert('账号错误,请重新登录!'); //or whatever
                location.href = "/";
            }
        },
        error: function(data) {
            alert('账号错误,请重新登录!'); //or whatever
            location.href = "/";
        }
    });

    var Main = {
      data() {
        return {
            lucynumber: formdata.lucky,
            lucynumberisshow: formdata.isshow,
            totalValue: formdata.person.length,
            currentPage: 1,
            result: 1,
            flight: formdata.flight,
            date: formdata.date,
            departure: formdata.departure,
            landing: formdata.landing,
            destination: formdata.destination,
            origin: formdata.origin,
            auctionType: formdata.type,
            basePrice: formdata.basePrice,
            seat: formdata.seat,           //（以空姐端输入的座位数为准）
            auctionState: formdata.status,   //（1：正在进行中， 2：已结束）
            startTime: formdata.startTime,  //（竞拍没有开始的时候为 -1，其他时候有值）

            tableData: formdata.person
        }
      },
      mothods: {
            // handleSizeChange(val) {
            //     console.log(`每页 ${val} 条`);
            // },
            // handleCurrentChange(val) {
            //     console.log(`当前页: ${val}`);
            // },
      }
    }
    var Ctor = Vue.extend(Main)
    new Ctor().$mount('#app')
})