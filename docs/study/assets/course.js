(function () {
  'use strict'

  const lessons = []
  const phases = [
    ['第一阶段：先学会读代码', 1, 5, '终端、Node、pnpm、TypeScript、ESM 和测试。'],
    ['第二阶段：应用怎样启动', 6, 9, 'YAML、Profile、Bundle、CLI 与 Boot。'],
    ['第三阶段：Cordis 运行骨架', 10, 13, 'Context、Service、插件生命周期、Effect 与事件。'],
    ['第四阶段：模型与会话', 14, 19, 'LLM 消息、流、Session 日志和事件溯源。'],
    ['第五阶段：Prompt、工具与 Agent Loop', 20, 25, '模型输入组装、工具调用与一次 turn 的完整执行。'],
    ['第六阶段：存储与外部入口', 26, 30, '持久化、投影、Web、API、SDK 与全仓毕业路线。'],
  ]
  const D = (day, title, summary, time, outcomes, concept, analogy, reads, lab, practice, quiz) => lessons.push({ day, title, summary, time, outcomes, concept, analogy, reads, lab, practice, quiz })
  const R = (title, path, text, question) => ({ title, path, text, question })

  D(1, '先学会在仓库里找路', '不读复杂实现，先建立目录、package 和测试的地图。', '45 分钟',
    ['区分 workspace、group 与 package', '知道陌生目录先读哪张卡片', '建立源码学习笔记'],
    '根仓库由很多可独立检查的 npm package 组成。packages/core 是领域分组，packages/core/session 才是具体 package。运行关系由 import 与配置决定，不由目录顺序决定。',
    '把仓库看成学校：group 是院系，package 是课程。先看课程说明和实验，再进复杂实现。',
    [R('根 manifest 只看五个字段', 'package.json', '找 type、packageManager、engines、workspaces、scripts，各写一句中文解释。', '这些字段分别约束运行方式、工具、Node 版本、成员范围和命令入口吗？'),
      R('读全仓分组地图', 'packages/README.md', '把 51 个 group 暂分为核心、能力、外部入口、基础设施，不要求一次分对。', 'group 的目录位置是否等于运行顺序？'),
      R('比较两层 README', 'packages/core/README.md', '比较本页的 group 文档卡片与 package 文档定位信息。', '哪一层解释家族，哪一层解释具体服务？'),
      R('认识固定文件', 'packages/core/session/package.json', '确认 src、tests、README、package.json 的不同职责，第一遍不读生成的 lib。', '行为不清楚时为什么 tests 往往比实现更适合作为入口？')],
    'pwd\nrg --files packages/core/session | head -30\nrg -n "deriveMessages" packages/core/session',
    '画四列笔记：路径、职责、输入、输出。先填 package.json、packages/core/session、apps/cli 三行。',
    [['group 和 package 有何区别？', 'group 按领域组织多个 package；package 有自己的 package.json，是依赖和发布单元。'], ['为什么不按字母顺序读？', '目录顺序不表示执行依赖，应沿入口、数据和事件流阅读。']])

  D(2, 'Node.js 与 pnpm：命令怎样找到源码', '从根 script 跟到 dsh 的 TypeScript 入口。', '60 分钟',
    ['理解 Node 与 pnpm 的分工', '从 scripts 追到真实入口', '理解 workspace:^'],
    'Node.js 执行 JavaScript；pnpm 安装依赖并运行 package.json 中的脚本。pnpm dsh 会先找到根 script，再将参数交给脚本，而不是直接理解 Harness。',
    'Node 是厨房，pnpm 管理食材和开工流程，package.json 是菜单与值班表。',
    [R('定位 dsh script', 'package.json', '在本页卡片中找到 dsh，拆分 node、--import tsx/esm、入口路径与转交参数。', '哪一段让 Node 能运行 TypeScript ESM？'),
      R('阅读真实入口', 'apps/cli/src/bin.ts', '只看 import、parseDshArgs 与 switch，列出三个 mode。', 'profile、plugin、dump-config 各加载哪个模块？'),
      R('看 CLI 的 workspace 依赖', 'apps/cli/package.json', '寻找 workspace:^ 与 exports。', '它怎样保证引用当前仓库 package？'),
      R('理解 argv 解析', 'apps/cli/src/args.ts', '找 parseDshArgs 的输入与带 mode 的返回联合。', '为什么原始字符串必须先变成结构化意图？')],
    'node --version\npnpm --version\nstudy_home="$(mktemp -d)"\nDSH_HOME="$study_home" pnpm dsh --profile headless --dump-default-config',
    '选根 scripts 中的 test:docs，写出“命令 → manifest script → 执行脚本”的箭头链。',
    [['Node 与 pnpm 是同一件东西吗？', '不是。Node 执行程序，pnpm 管理依赖和脚本。'], ['workspace:^ 解决什么？', '明确依赖同仓库 workspace package，并按 workspace 版本解析。']])

  D(3, 'TypeScript：类型是读代码的路标', '从 Agent 测试认识 import、函数签名、interface 与 class。', '75 分钟',
    ['读懂参数和 Promise 返回类型', '区分值导入与 import type', '区分接口和实现'],
    'TypeScript 为 JavaScript 增加静态检查。text: string 约束参数，Promise<Context> 表示异步完成后得到 Context。类型帮助同进程代码，但不能替代文件、网络、模型数据的运行时验证。',
    '类型像图纸尺寸：能提前发现部件不匹配，却不会替你检查外部送来的材料。',
    [R('给 import 分三类', 'packages/core/agent-loop/tests/agent.spec.ts', '分成第三方、@deepseek-ai 仓库包、相对文件，并确认这个测试入口没有使用 import type。', '这些导入的名字为什么都必须在运行时存在？'),
      R('读测试 harness', 'packages/core/agent-loop/tests/agent.spec.ts', '在本页卡片中找到 function harness 和 send，只读参数、返回值与 await。', 'harness 最终产出什么？'),
      R('读 Agent 接口', 'packages/core/agent/src/types.ts', '先看 import type，再列出 Agent 的公开属性和方法，用“调用者可以……”翻译。', '接口是否解释内部怎样实现？'),
      R('对照实现类', 'packages/core/agent-loop/src/agent.ts', '找到 ReactLoopAgent implements Agent，核对接口成员。', '哪个 package 定义能力，哪个 package 实现循环？')],
    'pnpm exec vitest run packages/core/session/tests/session.spec.ts -t "derives message history from the event log"',
    '把 Agent 接口写成一段中文使用说明，不描述 private 方法。',
    [['import type 有何意义？', '说明只参与类型检查，不形成运行时依赖。'], ['interface 与 class 的区别？', 'interface 描述可用成员，class 提供状态和实现。']])

  D(4, 'ESM：文件怎样连接起来', '理解 import/export、import.meta.url 与动态 import。', '60 分钟',
    ['理解命名导出和动态导入', '知道相对 import 使用 .ts', '解释 import.meta.url'],
    'ES Module 用 export 公开名字、用 import 使用名字。静态 import 在加载前确定；await import() 到分支运行时才加载。模块 URL 是文件自身位置，不随启动目录变化。',
    '动态 import 像走到岔路才打开那一份地图，适合 CLI 的不同 mode。',
    [R('观察 Node ESM API', 'apps/cli/src/bin.ts', '找 node:fs、node:url、new URL 与 import.meta.url。', 'readVersion 为什么不用 process.cwd()？'),
      R('追命名导出', 'apps/cli/src/profile-boot.ts', '找到 export async function runProfile，再回 bin.ts 看动态导入。', 'import() 完成后得到什么对象？'),
      R('看穷尽检查', 'apps/cli/src/bin.ts', '理解 invocation satisfies never 的位置。', '新增 mode 忘记分支时谁会报错？'),
      R('核对源码与产物', 'docs/development.md', '在本页卡片中找到 TypeScript project layout。', 'src 与 lib 为什么不能混着作为同一次检查的输入？')],
    'rg -n "import.meta.url|await import" apps/cli/src packages/boot/app-boot/src',
    '画 bin.ts 的依赖小图，只画 args、profile-boot、plugin、dump-config，并标出动态边。',
    [['为什么用 import.meta.url？', '它稳定代表当前模块地址，适合相对定位资源。'], ['动态 import 返回什么？', 'Promise，完成后得到模块命名空间对象。']])

  D(5, '测试：把大系统缩成小实验', '学习 Arrange、Act、Assert 和 mock。', '75 分钟',
    ['分辨测试三阶段', '会用 -t 聚焦行为', '理解 mock 的职责'],
    '测试搭最小 Context、挂少量插件、触发一次动作并断言结果。第一遍先读断言，再回看动作与准备；这样能暂时跳过与行为无关的 fixture。',
    'Arrange 是布置实验台，Act 是操作一次，Assert 是读取仪器结果。',
    [R('读最短 Session 测试', 'packages/core/session/tests/session.spec.ts', '在本页卡片中找到 derives message history，圈出 new Session、append、deriveMessages、expect。', '哪一行是动作，哪一行是可观察结果？'),
      R('看 mock 模型', 'packages/core/agent-loop/tests/mock-adapter.ts', '看预设输出怎样被 complete/stream 消费。', '为什么它不需要 API Key？'),
      R('看 Agent harness', 'packages/core/agent-loop/tests/agent.spec.ts', '列出 ctx.plugin 的挂载顺序，暂不追内部。', '这个最小实验依赖哪些服务？'),
      R('从断言反推职责', 'packages/core/agent-loop/tests/agent.spec.ts', '选含 followup 的测试，先读 expect，再读触发动作。', '测试真正关心的结果是返回值、状态还是事件？')],
    'pnpm exec vitest run packages/core/session/tests/session.spec.ts -t "derives message history from the event log"\nrg -n "it\\(|test\\(" packages/core/agent-loop/tests/agent.spec.ts | head -30',
    '用中文写一个 Session 追加 user/message 后 deriveMessages 的 Arrange/Act/Assert。',
    [['为什么先看 expect？', '它明确测试关心的行为，减少无关搭建带来的负担。'], ['mock adapter 有何价值？', '提供确定、可控、无网络的模型实现。']])

  D(6, 'YAML：把应用结构写成数据', '从 headless patch 学缩进、数组、id、name 和 config。', '60 分钟',
    ['读懂 YAML 数组和对象', '识别插件条目字段', '知道 !!js 的限制'],
    'YAML 的缩进表示嵌套，短横线表示数组项，key: value 表示字段。Cordis loader 读取这些条目并挂载插件；配置选择实现，TypeScript 源码定义行为。',
    '空格在 YAML 中有语义。先识别父子层级，不必记住每个插件。',
    [R('看短 patch', 'packages/bundle/headless/cordis.patch.yml', '逐行标注插入、id、name、config。', '最外层是对象还是 patch 数组？'),
      R('看 base bundle', 'packages/bundle/base/cordis.patch.yml', '寻找 disabled 与平台条件。', 'id 为什么要跨 overlay 保持稳定？'),
      R('对照 manifest', 'packages/bundle/headless/package.json', '观察 bundle 元数据与 cordis.patch.yml 的关系。', '一个 bundle package 由哪些文件共同定义？'),
      R('读配置语法', 'docs/cordis-primer.md', '只读 loader configuration。', '为什么配置表达式必须是 !!js 而不是 !js？')],
    'rg -n "insert:|id:|name:|config:|disabled:" packages/bundle/*/cordis.patch.yml',
    '在笔记里写一个假的 hello 插件 YAML 条目，包含 id、name 和 enabled: true，不修改仓库配置。',
    [['短横线通常表示什么？', '当前缩进层级的一个数组元素。'], ['id 与 name 区别？', 'name 选择插件，id 标识配置行供后续 patch 定位。']])

  D(7, 'Profile 与 Bundle：配置层怎样叠加', '理解支持应用由同一启动器组合而成。', '75 分钟',
    ['区分 Profile、Bundle、Patch', '记住层叠顺序', '解释稳定 id'],
    'Profile 是用户选择的应用配方，Bundle 是可复用插件组合。bundle、profile patch、DSH_HOME patch、--patch overlay 依次叠加，后层可按 id 修改前层。支持 profile 为 web、headless、sdk、sdk-minimal、acp。',
    '这不是复制完整配置，而是对已有条目做定点修改。',
    [R('找模板', 'packages/boot/app-boot/src/profile.ts', '在本页卡片中找到 PROFILE_TEMPLATES，列出模板元数据。', '模板怎样把逻辑名对应到包？'),
      R('读 loadProfile', 'packages/boot/app-boot/src/profile.ts', '只沿成功路径看目录、manifest、layers、patches。', 'Profile 返回值携带哪些路径和层？'),
      R('读 composeEntries', 'packages/boot/app-boot/src/profile.ts', '看 insert 和 id 定位如何逐层处理。', '后层遇到未知 id 应怎样失败？'),
      R('对比应用 bundle', 'packages/bundle/web-app/cordis.patch.yml', '再看 headless、sdk-app、sdk-minimal、acp-app，只记录外部入口差异。', '哪些核心 spine 行被复用？')],
    'study_home="$(mktemp -d)"\nDSH_HOME="$study_home" pnpm dsh --profile headless --dump-default-config\nDSH_HOME="$study_home" pnpm dsh --profile headless --dump-config',
    '画 bundle → profile → DSH_HOME → overlay/telemetry 四层图，写明拥有者和优先级。',
    [['Profile 与 Bundle 谁更接近启动选择？', 'Profile；它再引用若干可复用 bundle。'], ['后层如何修改前层？', '通过稳定 id 找到同一配置条目并应用 patch。']])

  D(8, 'CLI 分发：从 argv 到 runProfile', '完整追踪 dsh --profile headless。', '75 分钟',
    ['画出 CLI 调用链', '理解判别联合', '区分 launcher 与 app 参数'],
    'process.argv 只是字符串数组。parseDshArgs 将它变成带 mode 的联合类型，bin.ts 用 switch 分发；-- 后的应用参数通过 cmdline service 提供，而不写进可热重载配置。',
    '先把含糊文本变成有类型的意图，执行阶段就能只处理有效字段。',
    [R('从 argv 开始', 'apps/cli/src/bin.ts', '解释 slice(2)，再看 parseDshArgs 调用。', 'argv 前两个元素通常是什么？'),
      R('读 invocation 类型', 'apps/cli/src/args.ts', '列出每个 mode 的专属字段。', 'mode 怎样帮助 TypeScript 收窄？'),
      R('映射到 options', 'apps/cli/src/profile-boot.ts', '在 RunProfileOptions 对应 profile、patchFiles、args、environment。', '哪些是启动时冻结的值？'),
      R('找 cmdline 注入', 'apps/cli/src/profile-boot.ts', '在本页卡片中找到 provideCmdline。', '为什么应用参数不参加 patch 热重载？')],
    'pnpm dsh --help\npnpm dsh --version',
    '手工解析 dsh --profile headless --patch local.yml -- task，写出 mode、profile、patchFiles、args。',
    [['为什么需要 mode？', '它判别联合分支，使字段和执行路径明确。'], ['args 为什么不属于 patch？', '它是本次调用输入；patch 是可组合和热重载的配置。']])

  D(9, 'Boot：配置树怎样变成 Context', '理解加载、挂载、ready 和关闭。', '90 分钟',
    ['理解 boot 输入输出', '区分进程存活与 ready', '认识 AbortSignal/dispose'],
    'runProfile 组合配置后创建 readiness、shutdown 与环境服务，再由 boot 挂载插件树。只有 boot 和 host setup 成功才 commit ready；信号或应用退出会 dispose fiber。',
    '异步系统中“进程存在”不等于“服务可用”，所以 readiness 必须显式提交。',
    [R('读 runProfile 开头', 'apps/cli/src/profile-boot.ts', '列 composeProfile、createAppReady、createProcessShutdown、AbortController。', '这些对象分别拥有哪段生命周期？'),
      R('看 boot 调用', 'apps/cli/src/profile-boot.ts', '找 rootConfig、patches 与 hostCtx 回调。', '哪些服务必须在配置行挂载前提供？'),
      R('读共享 boot', 'packages/boot/app-boot/src/index.ts', '找 boot 签名、Context 与 loader，只跟成功路径。', '函数最终交回什么？'),
      R('看受控关闭', 'apps/cli/src/process-shutdown.ts', '记录 SIGINT、SIGTERM 与 dispose。', '谁拥有最终进程退出码？')],
    'rg -n "composeProfile|boot\\(|commit\\(|SIGINT|SIGTERM|dispose" apps/cli/src/profile-boot.ts packages/boot/app-boot/src/index.ts',
    '画 parse→compose→provide→mount→host setup→ready 时间线，再画失败和信号到 dispose。',
    [['ready 为什么在 boot 后？', '避免消费者把尚未挂载完成的树当成可用应用。'], ['dispose 意味什么？', '按生命周期撤销资源、监听和服务。']])

  D(10, 'Cordis Context：插件的共享运行环境', '从 new Context 认识依赖注入。', '75 分钟',
    ['理解 Context', '知道插件不依赖全局单例', '理解 provider 可替换'],
    'Context 是服务、事件和生命周期的容器。插件从 ctx 获取 llm、tools、session 等能力，不自行 new 具体 provider，因此测试可给 mock，profile 可给真实 provider。',
    '接口像插座标准，消费者不必知道电来自哪座电站。',
    [R('观察最小 Context', 'packages/core/agent-loop/tests/agent.spec.ts', '在本页卡片中找到 new Context 与 ctx.plugin，列挂载顺序。', '后挂插件需要哪些先挂服务？'),
      R('看 Context 声明合并', 'packages/core/system-prompt/src/index.ts', '找 declare module 为 Context 增加 systemPrompt。', '这是运行时创建服务还是静态告诉编译器？'),
      R('看 Service 类', 'packages/llm/llm/src/index.ts', '找到 LlmRuntime extends TypertRemoteService，再看 Context 声明合并。', '服务名、远程调用能力和 Context 类型分别在哪里表达？'),
      R('读能力角色', 'docs/architecture.md', '在本页卡片中找到 capability seam。', 'Definition、Provider、Consumer 谁依赖谁？')],
    'rg -n "interface Context|extends Service|static inject|inject =" packages/core/session/src packages/core/tools/src packages/llm/llm/src | head -80',
    '从 packages/shell/README.md 找 Definition、Provider、Consumer 各一个并画箭头。',
    [['为何不直接 new DeepSeekAdapter？', '会把核心绑定具体 provider，难以替换和测试。'], ['Context 连接什么？', '服务访问、事件作用域与插件生命周期。']])

  D(11, 'Service 与能力族：定义、提供者、消费者', '用统一方法拆解任意功能。', '75 分钟',
    ['识别完整 capability seam', '理解 provider 可替换', '从依赖确认方向'],
    'Definition 声明请求、结果和服务；Provider 连接本地系统或外部 API；Consumer 把能力变成工具、命令或业务。Bundle 只选择组合，不承担实现。',
    '只看到一个 Service 类不能说能力完整，还要找谁实现、谁使用。',
    [R('以 LLM 看定义', 'packages/llm/llm/src/index.ts', '找 LlmRuntime 与 registerAdapter。', '定义层是否内置 DeepSeek HTTP 请求？'),
      R('看 provider', 'packages/llm/llm-deepseek/src/adapter.ts', '找 adapter 实现的接口和请求入口。', '它把哪两种数据格式互相转换？'),
      R('看消费者', 'packages/core/agent-loop/src/agent.ts', '在本页卡片中找到 llm 调用，确认只依赖 runtime。', 'Agent Loop 是否 import 具体 provider？'),
      R('换 shell 验证', 'packages/shell/README.md', '标出 Definition、local/pwsh Provider 和 Consumer。', '哪个 bundle 将这些角色装在一起？')],
    'rg -n "dsh-llm|dsh-llm-deepseek" packages/core/agent-loop/package.json packages/llm/*/package.json packages/bundle/*/package.json',
    '选 fs、web、subagent、workflow 之一，填 Definition、Provider、Consumer、Bundle、Test 五格卡片。',
    [['扩展应依赖谁？', '依赖 Service Definition，而非具体 provider。'], ['Bundle 负责实现吗？', '不负责，它声明组合和配置。']])

  D(12, 'Effect：注册必须能够撤销', '理解 disposer、热重载与生命周期。', '75 分钟',
    ['理解副作用和 disposer', '识别 ctx.effect/ctx.on', '知道泄漏如何发生'],
    '监听事件、注册工具、启动定时器都会改变共享环境。ctx.effect 在 scope 结束时调用安装函数返回的 disposer。无法撤销的注册会在重载后留下重复监听和陈旧服务。',
    '添加一项容易，真正的生命周期要求离开时精确移除自己添加的那项。',
    [R('看工具 register', 'packages/core/tools/src/index.ts', '在本页卡片中找到 register(，沿可见返回值识别撤销。', '重复名和 dispose 各怎样处理？'),
      R('看 Prompt 注册', 'packages/core/system-prompt/src/index.ts', '在本页卡片中找到 layers.effect 与 section/context 注册；ScopedLayers 在内部接入 Cordis effect。', '注册变化和撤销怎样通知消费者？'),
      R('看事件监听', 'packages/core/agent-loop/src/invariant.ts', '在本页卡片中找到 ctx.on，观察 llm/stream invariant 的注册。', '监听为何随 Context 一起销毁？'),
      R('核对不变量', 'AGENTS.md', '在本页卡片中找到 Registrations are effects。', '前面三处是否都满足规则？')],
    'rg -n "ctx\\.effect\\(|ctx\\.on\\(|\\.register\\(" packages/core/system-prompt/src packages/core/tools/src packages/core/agent-loop/src | head -100',
    '写 register(name) 伪代码：加入 Map、重名失败、返回删除同一项的函数，并思考重复 dispose。',
    [['register 为何不能只返回 void？', '生命周期系统将无法可靠撤销贡献。'], ['热重载为何放大泄漏？', '同一逻辑反复挂载，旧贡献会和新贡献同时生效。']])

  D(13, '事件与 Waterfall：插件怎样合作', '区分广播与合作链，牢记 next()。', '90 分钟',
    ['理解事件发布订阅', '区分 emit/waterfall', '知道必须调用 next'],
    'emit 通知“某事发生”；waterfall 让多个监听者依次处理一个值。waterfall listener 必须调用 next() 委托后续处理，返回而不调用会短路整个链。',
    '像接力：可在交棒前后工作，但不交棒会让后面所有人消失。',
    [R('比较事件声明', 'packages/core/system-prompt/src/index.ts', '对比 system-prompt/assemble 与 system-prompt/change 的 @mode。', '哪个事件的返回值是权威结果？'),
      R('找 waterfall 调用', 'packages/core/system-prompt/src/index.ts', '在本页卡片中找到 waterfall，看 assembly 进入和返回。', '链返回后还会做哪些完整性处理？'),
      R('看监听者委托', 'packages/core/system-prompt/src/invariant.ts', '在本页卡片中找到 next()，观察 invariant 如何取得下游 assembly 再检查。', '遗漏 next 后真正的组装和其他监听者为什么不会运行？'),
      R('读语义说明', 'docs/cordis-primer.md', '阅读 waterfall semantics。', '什么情况下短路才可能是明确意图？')],
    'rg -n "@mode (emit|waterfall|serial|bail)" packages/core/*/src packages/llm/llm/src | head -80',
    '画 A/B/C 调用栈：A 前→B 前→C→B 后→A 后，再画 B 忘记 next 的结果。',
    [['emit 与 waterfall 的核心差异？', 'waterfall 的链式返回值是权威结果，emit 主要广播。'], ['忘记 next 会怎样？', '链在当前 listener 停止，后续扩展不执行。']])

  D(14, 'LLM 消息：模型真正看见什么', '认识 role、content block、tool call 与 branded id。', '90 分钟',
    ['理解 Message 不是字符串', '识别内容块联合', '理解品牌类型'],
    '模型请求是结构化消息序列。User、Assistant、Tool 消息包含文本、推理、图片、工具调用或结果等内容块。品牌类型仍是字符串，却防止 SessionId、ToolCallId 等不同含义被误传。',
    '判别联合先看 type/role 标签，再读该分支独有字段，不要一次展开所有类型。',
    [R('从 Message 类型开始', 'packages/llm/llm/src/message.ts', '列角色及其 content 类型。', '哪个字段是联合的判别标签？'),
      R('展开内容块', 'packages/llm/llm/src/types.ts', '从 TextBlock、ReasoningBlock、ImageBlock、ToolCallBlock 和 ToolResultBlock 按模型输入、模型输出、工具协议分类。', '文本和 tool call 的必填字段有何不同？'),
      R('看品牌 id', 'packages/llm/llm/src/brand.ts', '观察 branded type 与构造函数。', '品牌类型是否等于外部输入验证？'),
      R('看请求序列化', 'packages/llm/llm-deepseek/src/serialize.ts', '从 serializeMessages 跟到 serializeRequest，只看文本消息和工具调用。', '内部 Message 在哪一层变成 DeepSeek API 字段？')],
    'rg -n "interface (TextBlock|ReasoningBlock|ImageBlock|ToolCallBlock|ToolResultBlock)|interface (UserMessage|AssistantMessage|ToolResultMessage)" packages/llm/llm/src/types.ts packages/llm/llm/src/message.ts',
    '手写用户文本消息和 assistant tool-call 对象，再说明互换两个 branded id 会产生什么风险。',
    [['Message 为何不能只是 string？', '还需表达角色、图片、推理、工具调用和结果。'], ['品牌类型验证 JSON 吗？', '不验证；外部数据仍需解析，它主要防同进程误用不同 id。']])

  D(15, '异步、流与取消', '理解 Promise、AsyncIterable、chunk 和 AbortSignal。', '90 分钟',
    ['区分 Promise 与异步迭代', '跟踪流式 chunk', '理解取消传播'],
    'Promise 最终给一个结果；AsyncIterable 通过 for await 随时间给多个 chunk。循环记录每个 chunk，再形成 assistant/message。AbortSignal 从生命周期拥有者传到模型和工具。',
    '流不等于没有最终结果，它只是让中间增量也可观察。',
    [R('看流的输入输出类型', 'packages/llm/llm/src/types.ts', '找 GenerateOptions、StreamChunk 和 signal；LlmAdapter.stream 的方法签名留到下一天。', '一次请求的输入和逐块输出分别是什么？'),
      R('读 mock stream', 'packages/core/agent-loop/tests/mock-adapter.ts', '看预设 chunk 怎样 yield。', '测试怎样控制到达顺序？'),
      R('跟 for await', 'packages/core/agent-loop/src/agent.ts', '在 step 找模型流与 assistant/chunk。', '何时形成最终 assistant/message？'),
      R('找取消链', 'packages/core/agent-loop/src/agent.ts', '在本页卡片中找到 AbortController、signal、aborted。', '谁创建信号，谁只消费信号？')],
    'rg -n "stream|assistant/chunk|Abort" packages/core/agent-loop/tests/agent.spec.ts packages/core/agent-loop/tests/mock-adapter.ts | head -80',
    '画 request→chunk1→chunk2→assistant/message→step/end 时间轴，再加 chunk1 后 cancel 的清理分支。',
    [['for await 消费什么？', '异步可迭代对象，每个值可在不同时间到达。'], ['信号为何从上层传入？', '拥有操作生命周期的一方负责取消，下游只响应。']])

  D(16, 'LlmRuntime 与 Adapter：替换模型提供者', '从 registry 追到 DeepSeek provider 和 mock。', '75 分钟',
    ['理解 adapter registry', '区分 route 解析与请求', '掌握替换路径'],
    'Provider 用 registerAdapter 登记模型能力；调用者提供 provider/model，LlmRuntime 解析精确 adapter。核心循环不导入 llm-deepseek，测试可登记 MockAdapter。',
    '默认值应在 provider 拥有的 resolve 阶段显式产生，不在 run 中偷偷补。',
    [R('读 Runtime 公共面', 'packages/llm/llm/src/index.ts', '找 registerAdapter 与解析/调用入口。', '未知 provider/model 怎样失败？'),
      R('看 DeepSeek 注册', 'packages/llm/llm-deepseek/src/index.ts', '找 apply 创建 adapter 并用 effect 注册。', '卸载时怎样撤销？'),
      R('看 adapter 类', 'packages/llm/llm-deepseek/src/adapter.ts', '只读配置与请求入口，跳过 SSE 细节。', 'provider 专属字段在哪一层处理？'),
      R('看测试替换', 'packages/core/agent-loop/tests/agent.spec.ts', '找到 mock 注册。', '为什么 Agent 代码不需要条件分支？')],
    'rg -n "llm-deepseek" packages/core/agent-loop packages/core/agent || true\nrg -n "llm-deepseek" packages/bundle',
    '假设新增 LocalModelAdapter，列 provider package、注册、bundle、测试；明确不应改 Agent Loop。',
    [['registry 比全局 adapter 灵活在哪？', '允许多个路由共存并按明确选择解析。'], ['新增 provider 要改循环吗？', '通常不需要，实现接口并注册即可。']])

  D(17, 'SessionEventMap：日志的词汇表', '读声明合并、事件 envelope 与未知事件拒绝。', '90 分钟',
    ['理解事件名到数据类型映射', '知道 seq/envelope', '理解 ignorable'],
    'SessionEventMap 将事件名映射到 data 类型，各插件通过声明合并扩展。append 的事件名决定 data 字段。seq 给事实连续顺序；持久日志读入时必须检查未知事件。',
    '未知事件可能影响模型历史，所以默认拒绝比悄悄忽略更可靠。',
    [R('读核心事件表', 'packages/core/session/src/types.ts', '先列 turn/start、step/start、user/message、assistant 事件。', '每个事件记录的是命令还是已发生事实？'),
      R('读 envelope/append', 'packages/core/session/src/index.ts', '找事件公共字段与 append 返回。', 'seq 在哪里分配？'),
      R('看扩展事件', 'packages/core/agent/src/inbox.ts', '找 declare module 扩展 SessionEventMap。', '为什么 agent 包可增加 session 事件而不改 core/session？'),
      R('看已知类型', 'packages/core/session/src/known-event-types.ts', '理解 known set 与 ignorable。', '未知但 ignorable 的含义是什么？')],
    'rg -l "interface SessionEventMap" packages | sort',
    '设计一次简单问答的事件序列，包含 turn、step、user、assistant 和结束事件，并连续编号。',
    [['声明合并带来什么？', '不同 package 可扩展同一事件映射并保持类型关联。'], ['未知事件为何默认拒绝？', '忽略可能导致不完整历史和错误重建。']])

  D(18, 'append 与 deriveMessages：从事实重建对话', '掌握 model-visible 等价于 logged。', '90 分钟',
    ['理解 append-only', '手工折叠消息', '解释可重建不变量'],
    'Session.append 只在尾部增加事件并分配 seq。deriveMessages 扫描日志，将用户、助手和工具事实折叠成下一次模型请求历史。任何模型可见输入若未记录，恢复后就会消失。',
    '日志是事实；模型消息和 UI 都是从事实计算出的不同视图。',
    [R('读最小测试', 'packages/core/session/tests/session.spec.ts', '在本页卡片中找到 derives message history，先手算期望。', '哪些事件进入 messages，哪些只属于控制？'),
      R('读 append', 'packages/core/session/src/index.ts', '记录 seq、事件发出和泛型约束。', 'append 后谁能立刻观察事件？'),
      R('读 deriveMessages', 'packages/core/session/src/index.ts', '第一遍只跟 user/assistant，第二遍看工具与替换。', '工具 call/result 怎样成对进入历史？'),
      R('对比 surface', 'packages/core/session/src/surface.ts', '看 deriveEventMessage 与 foldSurface。', 'UI surface 和模型 messages 为何不完全相同？')],
    'pnpm exec vitest run packages/core/session/tests/session.spec.ts -t "derives message history from the event log"',
    '设计“动态加入项目规则”：若模型可见，应记录什么 session event 或 request snapshot，恢复时怎样重建？',
    [['append-only 能纠正界面吗？', '能，追加 replacement 等事实，让投影得到新状态，不改旧事件。'], ['不变量防什么？', '防止重启、fork、replay 后模型上下文与原运行不一致。']])

  D(19, '事件溯源与 Surface：一个日志多种视图', '理解 fold、projection 与 replacement。', '90 分钟',
    ['理解事件溯源', '区分日志与投影', '理解 replacement'],
    '事件溯源保存发生过什么，再顺序 fold 成当前状态。foldSurface 生成 UI 视图，SessionProjectionRegistry 支持其他投影。重放同一事件应得到同一状态。',
    '像账本：余额由交易折叠得出，不是每次擦掉旧事实。',
    [R('读 Surface 类型', 'packages/core/session/src/surface.ts', '先看 SurfaceFoldResult 和事件分类，再看 foldSurface。', '折叠状态里保存哪些索引？'),
      R('看 surface 测试', 'packages/core/session/tests/session.spec.ts', '在本页卡片中找到 replacement 或 surface，手工演算一例。', '被替换事件还在原日志中吗？'),
      R('读投影定义', 'packages/session/session-projection/src/index.ts', '看 ProjectionDefinition 与 register。', '初始化、reduce、checkpoint 各自负责什么？'),
      R('看真实投影', 'packages/session/session-stats/src/projection.ts', '只列消费事件与产出统计。', '它能否脱离日志成为唯一事实？')],
    'rg -n "surfaceOp|replacement|foldSurface" packages/core packages/session | head -100',
    '模拟 [user A, assistant B, replace A→C]，分别写日志顺序和最终 surface。',
    [['projection 是唯一事实吗？', '不是，它通常可由 canonical log 重建。'], ['重放有何价值？', '支撑恢复、fork、测试和多个消费者的一致视图。']])

  D(20, 'SystemPrompt：模型指令怎样组装', '从 section/context/variable/tool 到 PromptAssembly。', '90 分钟',
    ['区分四类贡献', '理解 order/scope', '掌握 assemble waterfall'],
    '多个插件注册命名 section、动态 context、variables 和 tool provider。assemble 为当前 scope 收集并排序，执行 waterfall，再渲染。complete section 可拥有完整 prompt，但不能阻止工具和上下文协作。',
    'name 用于唯一性和替换，order 保证稳定排列，scope 限制可见范围。',
    [R('读四个类型', 'packages/core/system-prompt/src/index.ts', '读 PromptSection、PromptContext、ToolProviderResult、PromptAssembly。', '哪些字段组装后仍未渲染？'),
      R('读注册 API', 'packages/core/system-prompt/src/index.ts', '在本页卡片中找到 section/context/variable/tools 方法。', '每个注册是否返回 disposer？'),
      R('读 assemble', 'packages/core/system-prompt/src/index.ts', '按收集→动态解析→排序→waterfall→complete 编号。', '最终权威 assembly 从哪里返回？'),
      R('看真实贡献者', 'packages/core/agent-loop/src/index.ts', '在本页卡片中找到 systemPrompt 注册。', '新提示行为为何不必集中修改 SystemPrompt 类？')],
    'rg -n "systemPrompt\\.(section|context|variable|tools)" packages | head -100',
    '设计 identity(-1000)、persona(0)、tool-help(1000) 三段和 {{cwd}} 变量，手算顺序。',
    [['section 为什么要 name？', '用于唯一性、替换、诊断和稳定排序。'], ['动态 context 为何要记录快照？', '它模型可见，实际请求必须可重建。']])

  D(21, 'JSON Schema：模型参数要运行时验证', '区分 TypeScript 静态类型与外部 JSON。', '90 分钟',
    ['读懂 object/properties/required', '理解 schema 转换', '知道验证边界'],
    'Tool 的 TypeScript 类型只保护同进程代码；模型输出运行时才到达，可能缺字段或类型错误。JSON Schema 可跨进程描述参数，validateArgs 在执行前返回具体路径错误。',
    '图纸约束自家零件，门口验收负责外部送来的材料。',
    [R('读 schema spec', 'packages/core/tools/src/schema.ts', '从 String/Object 到 ParameterSchemaSpec，先跳过 Infer 类型。', 'required 在 spec 中怎样表达？'),
      R('看转换', 'packages/core/tools/src/schema.ts', '读 parameterSchemaSpecToJsonSchema。', 'required 数组怎样生成？'),
      R('看验证', 'packages/core/tools/src/schema.ts', '找 validateArgs 输入与 string[] 输出。', '为什么错误需要字段路径？'),
      R('看 defineTool', 'packages/core/tools/src/schema.ts', '观察 const generic 与实现参数。', '验证后实现为何能得到推导类型？')],
    'rg -n "validateArgs|defineTool|ToolArgsError|required" packages/core/tools/tests/tools.spec.ts packages/core/tools/src/schema.ts | head -80',
    '为 add(a,b) 写 required number schema，列 {}、{a:1}、{a:1,b:2} 的结果。',
    [['为何不是只返回 false？', '调用者需要具体字段路径和原因。'], ['外部 JSON 谁负责？', '运行时 parser/schema；TypeScript 负责验证后的同进程使用。']])

  D(22, 'ToolRuntime：从注册到执行结果', '追踪 schema、guard、调度、结果与日志。', '105 分钟',
    ['理解 ToolDefinition', '画 execute pipeline', '理解工具事件'],
    'ToolRuntime 保存定义，解析名称，验证参数，运行 restriction/guard 与 hooks，交给 scheduler 和实现，最后规范化成功或失败。Agent Loop 将 tool/call、tool/result 记录到 Session。',
    '模型请求工具不等于直接调用任意函数，中间层负责权限、超时、并发、错误与可观测性。',
    [R('读定义和结果联合', 'packages/core/tools/src/index.ts', '列 ToolDefinition 与 ToolExecutionResult 的关键字段。', '成功/失败用哪个 discriminant 区分？'),
      R('读 register', 'packages/core/tools/src/index.ts', '看 scoped layer、重复名、通知和 disposer。', '同名工具在哪个 scope 冲突？'),
      R('读 execute 主线', 'packages/core/tools/src/index.ts', '按 resolve→validate→guard→pre→dispatch→post→result 编号，跳过 PTC。', '哪一步仍处于不可信参数边界？'),
      R('看事件配对', 'packages/core/agent-loop/src/tool-calls.ts', '找到 tool/call 与 tool/result append。', 'callId 怎样关联两端？')],
    'rg -n "ToolNotFound|tool/result|execute\\(" packages/core/tools/tests/tools.spec.ts packages/core/agent-loop/tests/tool-calls.spec.ts | head -80',
    '画 echo 工具全链：注册→模型参数→validate→execute→result→session events，再加参数错误分支。',
    [['失败为何不总抛垮 Agent？', '预期工具失败可规范化给模型，让模型决定下一步。'], ['callId 有何作用？', '稳定关联一次调用、执行和对应结果。']])

  D(23, 'Agent 接口与 Inbox：输入先到哪里', '先理解公共控制面，再进入循环。', '90 分钟',
    ['区分接口与实现', '理解 next-turn/next-step', '理解 followup'],
    'followup 把 UserMessage 放进 Inbox 并唤醒循环。next-turn 成为下一轮输入；next-step 可在当前 turn 的下一 step 注入。队列变化也记录事件，保证恢复一致。',
    'Web、SDK、ACP 只调用公开 Agent，不应碰 private step。',
    [R('读 Agent 接口', 'packages/core/agent/src/types.ts', '列 session、status、followup、cancel、whenIdle。', '外部调用者可观察什么？'),
      R('读 InboxTarget', 'packages/core/agent/src/types.ts', '对比 next-turn 与 next-step。', '哪一种可影响当前 turn？'),
      R('读 Inbox', 'packages/core/agent/src/inbox.ts', '先读 append 和 claim/splice，再看日志事件。', '队列消费怎样留下可重建事实？'),
      R('读 followup', 'packages/core/agent-loop/src/agent.ts', '看入队、唤醒与 drain，暂不读 turn。', '为什么它不直接 await 模型？')],
    'rg -n "\\.followup\\(" packages apps | head -100',
    '模拟 A 在 idle 到达，B 以 next-turn、C 以 next-step 在运行中到达，预测消费时机。',
    [['followup 返回 void 为何可用？', '它入队并触发后台运行，调用者可用 whenIdle 或事件观察。'], ['next-step 为何必须记录？', '它会影响当前 turn 后续模型请求。']])

  D(24, '一次 turn：用户消息到结束原因', '逐段阅读 turn() 的正常路径。', '105 分钟',
    ['理解 turn/step 层级', '列关键 session events', '理解显式结束原因'],
    'Turn 是一次用户驱动工作，Step 是一次模型请求及工具处理。模型请求工具时，同一 turn 会有多个 step：工具结果进入日志，再请求模型。',
    '第一遍只读“文本回答”路径，第二遍加入工具，第三遍才看取消和错误。',
    [R('看类状态', 'packages/core/agent-loop/src/agent.ts', '列 session、inbox、status、turn/step 计数与服务。', '哪些状态属于一个 Agent 实例？'),
      R('读 turn 开始', 'packages/core/agent-loop/src/agent.ts', '从 private turn 到 turn/start、领取消息、step/start、user/message。', '为什么先写 turn/start？'),
      R('看循环继续条件', 'packages/core/agent-loop/src/agent.ts', '观察 step 返回值怎样决定继续。', 'null 与结束 reason 各表示什么？'),
      R('读 turn 结束', 'packages/core/agent-loop/src/agent.ts', '找到 turn/end 与 TurnEndReasonMap。', '调用者如何区分完成、取消和限制？')],
    'rg -n "private async turn|turn/start|step/start|step/end|turn/end|TurnEndReason" packages/core/agent-loop/src/agent.ts packages/core/session/src/types.ts',
    '画文本回复（1 step）和工具回复（至少 2 step）两条事件时间线。',
    [['为何分 turn 和 step？', '一次用户任务可能包含多次模型请求。'], ['显式 reason 有何价值？', '日志、SDK 和 UI 能可靠区分停止原因。']])

  D(25, 'step()：Prompt、LLM 与工具汇合', '完成核心脊柱端到端追踪。', '120 分钟',
    ['解释 step 输入输出', '理解 request 快照', '掌握完整数据流'],
    'step 组装 prompt、从日志 deriveMessages、解析模型 route、记录 request/header/context、消费 chunks 并形成 assistant/message；有 tool call 时执行并记录结果。下一 step 仍从日志重建。',
    'request/header 保存 system、tools 与调用配置，因为它们影响模型却不属于普通消息。',
    [R('读 step 签名', 'packages/core/agent-loop/src/agent.ts', '找 PromptAssembly、startsRequestSeries 与返回类型。', '哪些依赖在 turn 外准备，哪些在 step 内解析？'),
      R('追模型输入', 'packages/core/agent-loop/src/agent.ts', '定位 assemble、deriveMessages、request/header、request/context。', '四项各自如何被重建？'),
      R('追流输出', 'packages/core/agent-loop/src/agent.ts', '从模型调用到 chunk 与最终 message。', '原始 chunk 与最终消息为何都记录？'),
      R('转工具调度', 'packages/core/agent-loop/src/tool-calls.ts', '读并发上限、稳定顺序、cancel 与结果正常路径。', '并发完成顺序怎样避免破坏日志语义？')],
    'rg -n "assemble\\(|deriveMessages\\(|request/header|request/context|assistant/chunk|assistant/message|executeToolCalls" packages/core/agent-loop/src/agent.ts packages/core/agent-loop/src/tool-calls.ts',
    '画 followup→Inbox→turn→user event→assemble/derive→LLM→assistant event→tools→下一 step→turn/end，每边写数据类型。',
    [['header 为何不能只在内存？', 'system、tools、配置影响响应，恢复和 replay 必须知道实际快照。'], ['step 返回 null 常表示什么？', '当前 step 未结束 turn，例如工具后还需再次请求模型。']])

  D(26, '持久化：Session 怎样写入 JSONL', '从抽象服务走到文件 provider。', '105 分钟',
    ['区分内存 Session 与存储', '理解 coordinator/backend', '读 JSONL 格式'],
    'Session 管当前事件语义；SessionPersistence 定义耐久能力；Coordinator 处理批量、版本和 write-behind；JSONL provider 决定路径、header、事件行与截断扫描。',
    'JSONL 每行一个 JSON 值，便于追加。崩溃留下半行时只能接受完整前缀，不能猜。',
    [R('读抽象服务', 'packages/session/session-persistence/src/index.ts', '列保存、读取、列出、fork 等公共方法。', '调用者是否知道底层是文件还是 SQLite？'),
      R('读 backend 接口', 'packages/session/session-persistence/src/coordinator.ts', '看 PersistenceBackend、StoredPrefix/Suffix。', 'coordinator 与 provider 各拥有哪部分？'),
      R('读 JSONL 格式', 'packages/session/session-persistence-jsonl/src/format.ts', '从 HeaderLine、eventLines 到 scanLog，跳过 zstd。', '截断尾部怎样识别？'),
      R('读 provider 类', 'packages/session/session-persistence-jsonl/src/index.ts', '看 JsonlSessionPersistence 连接目录、格式和 coordinator。', 'Config 中哪些是部署可调值？')],
    'rg -n "it\\(|test\\(" packages/session/session-persistence-jsonl/tests/jsonl.spec.ts | head -30',
    '手写 header、user event、assistant event 三行 JSONL，截断第三行，解释 scanner 接受到哪里。',
    [['为何不直接写在 Session？', '存储能力和多种 provider 需独立替换，Session 只维护日志语义。'], ['write-behind 风险？', '内存已接受而磁盘未完成，必须处理刷新、错误和关闭等待。']])

  D(27, 'SQLite、Projection、Resume 与 Compaction', '理解版本、checkpoint 与上下文缩短。', '120 分钟',
    ['理解 schema version', '理解 projection checkpoint', '区分压缩与删事实'],
    'SqliteStore 实现相同 PersistenceBackend；schema.ts 用单调 SCHEMA_VERSION 拒绝旧格式。Projection checkpoint 缓存折叠进度。Compaction 记录摘要/checkpoint，使后续模型请求使用更短上下文。',
    '模型上下文压缩不是随意删除耐久历史，三种版本和生命周期不能混成一个概念。',
    [R('看 SQLite schema', 'packages/session/session-persistence-sqlite/src/schema.ts', '找 SCHEMA_VERSION、SessionRow、EventRow。', 'mutation 前验证什么？'),
      R('看 Store', 'packages/session/session-persistence-sqlite/src/store.ts', '对照 PersistenceBackend 标出 load/append/list/fork。', '哪些 SQL 细节被封在 provider 内？'),
      R('看投影 registry', 'packages/session/session-projection/src/index.ts', '读 definition、checkpoint、register。', '缓存丢失后能否从事件重建？'),
      R('看 compaction', 'packages/compaction/compaction/src/index.ts', '先读公共类型，再看 compaction-basic README。', 'Definition 与 basic Provider 如何分离？')],
    'rg -n "SCHEMA_VERSION|SESSION_FORMAT_VERSION|checkpoint|fork" packages/core/session packages/session/session-persistence* packages/session/session-projection packages/compaction/compaction/src | head -100',
    '画存储 schema、session event format、模型 context epoch 三条轴，说明为何不是一个版本号。',
    [['compaction 等于删日志吗？', '不是该概念；它记录摘要/checkpoint并改变后续模型上下文。'], ['checkpoint 为何可丢？', '它是缓存，可从 canonical events 重新 reduce。']])

  D(28, 'Web Host 与 Client：事件怎样变界面', '从 web bundle 追到服务器、API、store 与 UI。', '120 分钟',
    ['区分 Host/API/Client', '理解 UI 事件投影', '追踪一个浏览器动作'],
    'web profile 仍使用同一 Agent spine。Host 提供服务器和静态资源，API controller 暴露 Agent/Session，Client connection 连接 gateway，store 保存客户端投影，ui-* 注册界面模块。',
    '工具卡片从 raw session events 和持久结果元数据派生，刷新后才能一致重建。',
    [R('从 web bundle 开始', 'packages/bundle/web-app/cordis.patch.yml', '把 host、api、client、core 条目分组。', '组合层有没有实现业务循环？'),
      R('读 Host 地图', 'packages/host/README.md', '找 webserver、frontend-static、directory-picker。', '谁监听端口，谁只提供资源？'),
      R('读 session controller', 'packages/api/session-controller/README.md', '追 prompt、history、control 到 src 文件。', '哪一处最终调用 Agent 接口？'),
      R('读 Client 地图', 'packages/client/README.md', '画 connection→store→modules→ui-*。', 'UI 如何取得远端事实？')],
    'rg -n "followup\\(|session.*prompt|prompt.*session" packages/api/session-controller/src packages/client | head -100',
    '选择发送消息或取消，画浏览器→RPC→controller→Agent→Session events→store/UI 往返图。',
    [['Web 有独立 Agent Loop 吗？', '没有，它通过 API 使用同一核心服务。'], ['为何 UI 从事件派生？', '事件可持久化和重放，刷新与多客户端可一致。']])

  D(29, 'API、Typert、SDK、ACP 与 Webhook', '比较外部协议怎样投影同一核心。', '120 分钟',
    ['理解请求与通知', '比较四种入口', '定位验证边界'],
    'Typert gateway 服务 Web RPC 与事件流；SDK 用逐行 JSON-RPC 启动 dsh profile；ACP 映射 Agent 生命周期；Webhook 验证外部事件后构造 session request。它们都复用核心循环。',
    '进程和网络 JSON 必须验证；同进程已受类型约束的值不重复做敌意验证。',
    [R('读 SDK protocol', 'packages/sdk/protocol/src/types.ts', '列 request map 与 notification map。', 'session/prompt 和 session/event 为何一请求一推送？'),
      R('读 SDK server', 'packages/sdk/server/src/server.ts', '看 HarnessSdkJsonRpcServer 怎样接收请求并发送 notification；客户端的 pending request map 位于 packages/sdk/client/src/client.ts。', '服务端怎样把协议请求转成 Agent 操作？'),
      R('读 ACP 会话适配', 'packages/acp/acp/src/session.ts', '从 AcpSession.create/resume 看它怎样取得核心 AgentHandle，再回 index.ts 看 inject/apply。', 'ACP 自己是否实现 turn/step 循环？'),
      R('读 GitHub Webhook 边界', 'packages/webhook/webhook-github/src/handler.ts', '从 createGitHubWebhookHandler 看 HTTP 方法、payload、签名和 dispatch 的先后顺序；Definition 在 packages/webhook/webhook/src/index.ts。', '未验证 body 能否进入规则执行？')],
    'rg -n "JSON\\.parse|Schema|parse.*Message|interface .*RequestMap|inject =" packages/sdk packages/api/gateway packages/acp/acp packages/webhook | head -120',
    '做表：入口、传输、如何取得 Agent、事件怎样返回、运行时验证点；填 Web、SDK、ACP、Webhook。',
    [['SDK 为何有 notification？', 'session event/status 随时间由服务端推送，不对应单次响应。'], ['新增入口最应复用什么？', 'Agent、Session、Persistence 服务与事件，不复制 turn/step。']])

  D(30, '毕业日：独立读完整个能力族', '用固定方法覆盖剩余源码并画最终架构。', '150 分钟',
    ['独立拆解陌生 group', '掌握全仓优先级', '形成长期阅读方法'],
    '读完整仓库不是背每一行，而是对每个能力族依次读 group README、Definition、Provider、Consumer、bundle、最小测试、错误和生命周期测试。experimental 最后读。',
    '仓库会继续变化；真正稳定的是能根据角色、依赖和事件重新定位最新实现。',
    [R('复盘核心脊柱', 'docs/architecture.md', '先闭卷讲 CLI→Profile→Cordis→Agent→Session/Prompt/LLM/Tools→Persistence→External，再纠错。', '四条关键不变量各在哪个源码点体现？'),
      R('读常用能力', 'packages/README.md', '依次为 fs、shell、subprocess、terminal、web、skill、interaction、subagent、workflow 填五格卡。', '哪个角色缺失时 seam 不完整？'),
      R('读运行治理', 'packages/README.md', '再读 guard、context、preset、plan、todo、goal、jobs、schedule、compaction、settings、credentials。', '它们在哪个扩展点加入行为？'),
      R('最后读支撑实验', 'packages/README.md', 'boot、util、test-support、hooks、python/native，experimental 按兴趣最后读。', '哪些目录不是正式产品能力？')],
    'rg --files packages/web | sort\nrg -n "dsh-web" packages/bundle/*/cordis.patch.yml',
    '毕业项目：画配置叠加、一次 Agent turn、能力替换三张图；写 800–1500 字说明；明确四条不变量：注册可撤销、waterfall 委托、模型可见可重建、扩展依赖定义而非 provider。',
    [['怎样算会读项目？', '能从入口追到 session events，解释 provider 替换，并用测试验证陌生能力。'], ['哪些最后读？', 'experimental、平台兼容深层、复杂并发恢复和生成代码。']])

  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const memoryProgress = new Map()
  const progress = {
    get(name) {
      try { return localStorage.getItem(name) }
      catch { return memoryProgress.get(name) ?? null }
    },
    set(name, value) {
      try { localStorage.setItem(name, value) }
      catch { memoryProgress.set(name, value) }
    },
    clear() {
      try {
        Object.keys(localStorage).filter(name => name.startsWith('dsh-study-v2-')).forEach(name => localStorage.removeItem(name))
      } catch {
        memoryProgress.clear()
      }
    },
  }
  const key = (day, item) => `dsh-study-v2-day-${day}-${item}`
  const checked = (day, item) => progress.get(key(day, item)) === '1'
  const setChecked = (day, item, value) => progress.set(key(day, item), value ? '1' : '0')
  const done = day => checked(day, 'done')

  function renderLesson(day) {
    const item = lessons[day - 1]
    if (!item) return
    document.title = `第 ${day} 天：${item.title} | DeepSeek Harness 源码课`
    const outcomes = item.outcomes.map(x => `<div>${esc(x)}</div>`).join('')
    const reads = item.reads.map((r, i) => `<li><h3>${esc(r.title)}</h3><a class="source" href="../../${esc(r.path)}" target="_blank">${esc(r.path)}</a><p>${esc(r.text)}</p><div class="observe"><b>读完要回答：</b>${esc(r.question)}</div><label><input type="checkbox" data-item="read-${i}"> 已完成这一步</label></li>`).join('')
    const quiz = item.quiz.map((q, i) => `<details><summary>${i + 1}. ${esc(q[0])}</summary><div><p>${esc(q[1])}</p></div></details>`).join('')
    document.querySelector('main').innerHTML = `<article><div class="lesson-head"><div class="meta">第 ${day} 天 · 核心阅读 ${esc(item.time)}，项目另行安排</div><h2>${esc(item.title)}</h2><p>${esc(item.summary)}</p></div><section class="panel"><h2>今天完成什么</h2><div class="outcomes">${outcomes}</div><p><b>前置要求：</b>${day === 1 ? '无。你只需要能打开终端和编辑器。' : `完成第 ${day - 1} 天；没有完全懂也可以继续，先在不懂处做标记。`}</p></section><section class="concept"><h2>先学一个概念</h2><p>${esc(item.concept)}</p><p class="analogy"><b>帮助理解：</b>${esc(item.analogy)}</p></section><section><h2 id="reading">跟着读源码</h2><p>不要一次打开所有文件。严格按下面顺序，每一步先看指定符号和成功路径，遇到陌生语法只查当前这一处。</p><ol class="steps">${reads}</ol></section><section class="panel lab"><h2 id="lab">动手实验</h2><p>命令默认从仓库根目录运行。先预测结果再执行；失败也要保留报错并判断失败在哪一层。</p><pre><code>${esc(item.lab)}</code></pre><label><input type="checkbox" data-item="lab"> 我已预测并执行或静态核对，记录了实际结果</label></section><section class="panel practice"><h2 id="practice">项目练习</h2><p>${esc(item.practice)}</p><label><input type="checkbox" data-item="practice"> 我已完成练习并留下自己的解释</label></section><section><h2 id="quiz">自测：先回答再展开</h2>${quiz}</section><section class="panel rule"><h2>今天的完成标准</h2><ul class="checklist"><li><label><input type="checkbox" data-item="explain"><span>我能不用源码，用自己的话讲出今天的概念</span></label></li><li><label><input type="checkbox" data-item="paths"><span>我能说出今天最重要的两个源码路径及职责</span></label></li><li><label><input type="checkbox" data-item="done"><span>完成第 ${day} 天，并在课程首页标记进度</span></label></li></ul></section><nav class="day-nav" aria-label="日课导航">${day > 1 ? `<a href="day-${String(day - 1).padStart(2, '0')}.html">← 第 ${day - 1} 天</a>` : '<a href="index.html">← 课程首页</a>'}<a href="index.html">课程地图</a>${day < 30 ? `<a href="day-${String(day + 1).padStart(2, '0')}.html">第 ${day + 1} 天 →</a>` : '<a href="index.html">完成课程 →</a>'}</nav></article>`
    document.querySelector('.side').innerHTML = `<strong>第 ${day} 天导航</strong><a href="index.html">课程地图</a><a href="#reading">源码阅读</a><a href="#lab">动手实验</a><a href="#practice">项目练习</a><a href="#quiz">自测</a><div class="day-meter">本日进度<div class="meter"><span id="day-progress"></span></div><span id="day-count"></span></div>`
    bindChecks(day)
  }

  function bindChecks(day) {
    const boxes = [...document.querySelectorAll('[data-item]')]
    for (const box of boxes) {
      box.checked = checked(day, box.dataset.item)
      box.addEventListener('change', () => { setChecked(day, box.dataset.item, box.checked); updateMeter(day, boxes) })
    }
    updateMeter(day, boxes)
  }
  function updateMeter(day, boxes) {
    const count = boxes.filter(x => x.checked).length
    const percent = boxes.length ? Math.round(count / boxes.length * 100) : 0
    const bar = document.querySelector('#day-progress')
    if (bar) bar.style.width = `${percent}%`
    const label = document.querySelector('#day-count')
    if (label) label.textContent = `${count} / ${boxes.length} 项`
    setChecked(day, 'done', percent === 100)
  }
  function renderIndex() {
    const root = document.querySelector('#course-list')
    root.innerHTML = phases.map(([title, first, last, text]) => `<section class="phase"><h2>${title}</h2><p>${text}</p><div class="day-grid">${lessons.filter(x => x.day >= first && x.day <= last).map(x => `<a class="day-card${done(x.day) ? ' done' : ''}" href="day-${String(x.day).padStart(2, '0')}.html"><small>第 ${x.day} 天 · 核心阅读 ${esc(x.time)}</small><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p></a>`).join('')}</div></section>`).join('')
    const completed = lessons.filter(x => done(x.day)).length
    document.querySelector('#total-count').textContent = `${completed} / 30 天`
    document.querySelector('#total-progress').style.width = `${Math.round(completed / 30 * 100)}%`
    const next = lessons.find(x => !done(x.day)) || lessons[29]
    const button = document.querySelector('#continue')
    button.href = `day-${String(next.day).padStart(2, '0')}.html`
    button.textContent = completed === 30 ? '复习第 30 天' : `继续第 ${next.day} 天`
    document.querySelector('#reset-course').addEventListener('click', () => {
      if (!window.confirm('确定清除这套课程的全部勾选进度吗？')) return
      progress.clear()
      window.location.reload()
    })
  }
  function readingProgress() {
    const bar = document.querySelector('#reading-progress')
    const update = () => { const max = document.documentElement.scrollHeight - innerHeight; bar.style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 100}%` }
    addEventListener('scroll', update, { passive: true }); update()
  }
  addEventListener('DOMContentLoaded', () => {
    const day = Number(document.body.dataset.day)
    if (day) bindChecks(day); else renderIndex()
    readingProgress()
  })
}())
