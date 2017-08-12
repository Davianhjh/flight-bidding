$(function(){
    var app = new Vue({
        el: "#home-app",
        data: {
            title: "AGiView 竞拍",
            items: [
                {productId: '00001', productTitle: 'MacBook Pro 2017', productBrief: 'Apple MPTT2CH/A', productCount: 2, thumb: 'apple_macbook-pro-2017-15.jpg', timeRemaining: 4300},
                {productId: '00002', productTitle: '阿狸的微笑', productBrief: '阿狸表情包', productCount: 1, thumb: 'ali.png', timeRemaining: 3400},
            ],
        },
        methods: {
            updateItems: function(){
                items = [];
            }
        }
    });
});