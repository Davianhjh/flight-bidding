$(function(){
    var app = new Vue({
        el: "#login-app",
        data: {
            username: "",
            password: ""
        },
        methods: {
            login: function (event) {
                if (this.username.length == 0) {
                    alert("请输入正确的账号");
                    return;
                }
                if (this.password.length == 0) {
                    alert("请输入正确的密码");
                    return;
                }
                if (event) {
                    var username = this.username;
                    var password = this.password;
                    var testurl = "/loginAdmin?username="+ username + "&password=" + password;

                    $.ajax({
                        url: testurl,
                        type: 'GET',
                        success: function(data){
                            console.log(data);
                            if (data.result == 1) {
                                localStorage.agiToken = data.token;
                                console.log(localStorage.agiToken);
                                location.href = '/fightslist';
                            } else {
                                alert('您的账号密码不正确！请重新登录');
                            }
                        },
                        error: function(data) {
                            alert('登录失败，请检查账号密码！');
                        }
                    });
                }
            }
        }
    });
});