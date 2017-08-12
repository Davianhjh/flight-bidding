// Vue Components
Vue.component('top-nav', {
    template: "<div class=\"top-nav-container\">"+
                "<div id=\"left-nav-switch\" v-on:click=\"alert\">"+
                "</div>"+
                "<div id=\"top-nav-title\">{{title}}"+
                "</div>"+
            "</div>",
            // +"<div class=\"top-nav-placeholder\"></div>\"",
    props: ['title'],
    methods: {
        alert: function(event){
            alert("Left Navigation Bar not available");
        }
    }
});
Vue.component('top-nav-placeholder', {
    template: "<div class=\"top-nav-placeholder\"></div>"
})

Vue.component('product-list', {
    props: ['viewType']
});
Vue.component('product-grid-item', {
    template: '<div class="product-grid-item">'+
                    '<div class="product-grid-thumbnail" v-on:click="viewProduct(productId)" '+
                        ':style="\'background-image:url(/data/products/image/\'+thumb+\')\'">'+
                        '<div class="thumbnail-count-down">{{timeDisplay}}</div>'+
                    '</div>'+
                    '<div class="product-grid-intro" v-on:click="viewProduct(productId)">'+
                        '<div class="product-grid-title">{{productTitle}} <span class="product-grid-count">{{productCount}}</span><span class="product-grid-count-text">件</span></div>'+
                        '<div class="product-grid-brief">{{productBrief}}</div>'+
                    '</div>'+
                    '<div class="product-grid-actions">'+
                        '<div class="product-grid-dummy-action-1"></div>'+
                        '<div class="product-grid-dummy-action-2"></div>'+
                        '<div class="product-grid-like"></div>'+
                    '</div>'+
                '</div>',
    props: ['productId', 'productTitle', 'productBrief', 'productCount', 'thumb', 'timeRemaining', 'timeDisplay'],
    methods: {
        viewProduct: function(id){
            window.location.href = "/product/"+id;
        }
    },
    created: function(){
        timeDisplay = timeRemaining/60 + " : "+timeRemaining%60;
    }
});