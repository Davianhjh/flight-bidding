// Configuration for debug options
var config = {

    realTimeCompile: {
        less: true
        /**less: 每次服务启动时 LESS 会被编译成静态的 CSS。此项为
         * false 时对样式文档的请求将返回启动时编译的 CSS；为 true 
         * 时将实时编译LESS文档以保证最新的变动生效。 */
    }

}
module.exports = config;