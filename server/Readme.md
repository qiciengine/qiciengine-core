服务器文档
http://docs.zuoyouxi.com/manual/Plugin/server.html

服务器启动步骤：
1、在 package.json 所在目录执行 npm install，下载安装 server 所依赖的 js 库
2、默认的启动配置文件为 config/Config.js，可自定义启动配置文件，运行不同的游戏进程，比如：node gs/StartGs.js config/Config2.js --repl
3、window 下执行 start_server.bat；linux 下执行 ./start_server.sh；或手动执行 node gs/StartGs.js --repl，启动单进程服务
4、在 linux 下执行 start_cluster.sh，可启动 cluster 多进程集群，实现负载分担（使用 pm2 进行 cluster 管理）

服务器目录结构说明：
config : 存放配置文件
global : 存放全局通用的功能代码
    base : 存放全局函数
	include : 存放全局定义
	clone : 存放全局对象
	daemons : 存放全局模块
	cmds : 存放全局的消息处理代码
gs : 存放 game server 相关的功能代码
    base : 存放 gs 相关的全局函数
	include : 存放 gs 相关的定义
	clone : 存放 gs 相关的对象
	daemons : 存放 gs 相关的模块
	cmds : 存放 gs 相关的消息处理代码
logs : 存放服务器日志文件

服务器框架功能：
1、http 消息通信及派发机制
2、redis 数据库支持：提供用户自定义 redis 命令接口、multi 多事务处理接口
3、mysql 数据库支持：提供 query、transaction 接口
3、完善日志系统，提供多级日志接口、按日期写日志文件功能
4、脚本异常报错捕获处理，打印报错栈，写日志文件
5、win32 脚本交互控制台
6、支持 telnet 后台机制，以便 linux 下可 telnet 游戏进程后台，与游戏脚本环境进行交互
7、支持命令行指定启动配置文件的支持，以便以不同的配置文件启动不同的游戏进程
8、提供 nodejs cluster 启动机制
9、简易帐号登录验证、登录保存数据的功能
10、支持微信SDK的基本接口
11、websocket 消息通信及派发机制
