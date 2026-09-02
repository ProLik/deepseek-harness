import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'
import phase1 from './phase-1.mjs'
import phase2 from './phase-2.mjs'
import phase3 from './phase-3.mjs'
import phase4 from './phase-4.mjs'
import phase5 from './phase-5.mjs'
import phase6 from './phase-6.mjs'

const studyDir = resolve(import.meta.dirname, '..')
const repoDir = resolve(studyDir, '../..')
const enrichments = [...phase1, ...phase2, ...phase3, ...phase4, ...phase5, ...phase6]
const source = readFileSync(resolve(studyDir, 'assets/course.js'), 'utf8')
  .replace('  const esc =', '  globalThis.__lessons = lessons\n  const esc =')
const sandbox = { addEventListener() {}, localStorage: { getItem() { return null }, setItem() {}, removeItem() {} } }
vm.runInNewContext(source, sandbox)
const lessons = sandbox.__lessons

if (lessons.length !== 30 || enrichments.length !== 30) {
  throw new Error(`expected 30 lessons and enrichments; received ${lessons.length} and ${enrichments.length}`)
}

for (let index = 0; index < lessons.length; index += 1) {
  const lesson = lessons[index]
  const deep = enrichments[index]
  if (lesson.day !== deep.day) throw new Error(`lesson order mismatch at ${index + 1}`)
  verifyLessonSources(lesson, deep)
  writeFileSync(resolve(studyDir, `day-${String(lesson.day).padStart(2, '0')}.html`), renderLesson(lesson, deep))
}

function verifyLessonSources(lesson, deep) {
  if (lesson.reads.length !== 4 || deep.symbols.length !== lesson.reads.length) {
    throw new Error(`day ${lesson.day}: expected four reading stops and one target list per stop`)
  }
  for (let index = 0; index < lesson.reads.length; index += 1) {
    const path = lesson.reads[index].path
    const content = readFileSync(resolve(repoDir, path), 'utf8')
    const targets = sourceTargets(deep.symbols[index])
    for (const target of targets) {
      if (!content.includes(target)) {
        throw new Error(`day ${lesson.day}, reading ${index + 1}: ${JSON.stringify(target)} is absent from ${path}`)
      }
    }
  }
}

function h(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function code(value) {
  return `<pre><code>${h(value)}</code></pre>`
}

function sourceTargets(symbols) {
  return symbols.split(' / ').map(target => target.trim()).filter(Boolean)
}

function excerptAround(lines, index, path) {
  const before = path.endsWith('.md') ? 2 : path.endsWith('.yml') || path.endsWith('.json') ? 3 : 4
  const after = path.endsWith('.md') ? 10 : path.endsWith('.yml') || path.endsWith('.json') ? 10 : 14
  const start = Math.max(0, index - before)
  const end = Math.min(lines.length, index + after + 1)
  const width = String(end).length
  const excerpt = lines.slice(start, end).map((line, offset) => {
    const content = line.replace(/[ \t]+$/, '')
    return `${String(start + offset + 1).padStart(width, ' ')} |${content ? ` ${content}` : ''}`
  }).join('\n')
  return { start: start + 1, end, excerpt }
}

function sourceEvidence(path, symbols) {
  const lines = readFileSync(resolve(repoDir, path), 'utf8').split('\n')
  const matches = sourceTargets(symbols).map(target => {
    const candidates = lines.flatMap((line, index) => line.includes(target) ? [{ line, index }] : [])
    const scored = candidates.map(candidate => {
      const trimmed = candidate.line.trim()
      const isComment = /^(\/\/|\/\*|\*|#)/.test(trimmed)
      let score = isComment ? -10 : 5
      if (/\b(class|interface|type|function|const|let|abstract)\b/.test(trimmed)) score += 5
      if (trimmed.includes(`${target}(`) || trimmed.includes(`${target} (`)) score += 4
      if (target.startsWith('@mode') && isComment) score += 20
      if (path.endsWith('.md') && trimmed.startsWith('#')) score += 20
      return { ...candidate, score }
    })
    scored.sort((left, right) => right.score - left.score || left.index - right.index)
    const index = scored[0]?.index ?? -1
    if (index < 0) throw new Error(`${JSON.stringify(target)} is absent from ${path}`)
    return { target, index, line: lines[index].trim(), ...excerptAround(lines, index, path) }
  })
  return { matches }
}

function guidedReading(path, title, question) {
  const common = [
    `先把这一站的问题写在纸上：“${question}”阅读的目的不是看完文件，而是用源码证据回答它。`,
    `在本页的 ${path} 源码卡片中按顺序阅读目标行。先观察目标上方的声明和下方第一个完整代码块；完整文件链接只是学完后的可选延伸。`,
  ]
  if (path.endsWith('.ts')) {
    return [...common,
      '第一遍只读签名：判断目标是类型、函数、类、测试还是插件入口；圈出参数、返回类型，以及 extends、implements、async 或生成器星号。此时不进入 helper。',
      '第二遍读数据：给每个参数写一个生活化示例，沿赋值、条件和 return 找它怎样变化。遇到泛型时先把 T 当成“暂时未知但前后一致的类型”。',
      '第三遍读协作：标出 service 调用、ctx.plugin、ctx.effect、ctx.on、事件 append/emit 和跨 package 调用。这些位置才是架构关系，不要把普通局部变量也画成组件。',
      '第四遍读失败与异步：在卡片中找 throw、catch、await、yield、finally、AbortSignal。写清失败是抛给调用者、记录成事件，还是由清理逻辑吸收。没有这些关键字也要明确记“本段未处理”。',
      '只追当前卡片展示的直接调用：若片段出现 helper，只写下它接收什么、可能返回什么；本轮不需要离开页面补全整个调用栈。',
      '用本页的运行跟踪、命令说明和参考成果交叉检查理解。它们是由当前源码目标生成的辅助证据，但不要把示例措辞误认为生产代码。',
      `遮住卡片，用“${title} 接收……，通过……，产生……；失败时……”说出一句完整结论，再展开卡片核对。`,
    ]
  }
  if (path.endsWith('.json')) {
    return [...common,
      '先确认目标位于根对象、scripts、exports、dependencies 还是 dsh 元数据。JSON 的父级字段决定值由哪个工具解释。',
      '把一条长字符串拆成“可执行程序、加载器参数、源文件、转交参数”；把依赖值拆成“包名、版本协议、是否为 workspace”。',
      '遇到 exports 时分别记录导出键和目标文件；遇到 dependencies 时只说明静态依赖关系，不据此断言运行时一定调用。',
      '根据本页讲义判断字段值的消费者。标准 package.json 字段由 Node、pnpm 或打包器读取；dsh 专用字段则结合本页其他源码卡片判断解析者。',
      '检查相邻字段是否提供条件或例外，例如 type、engines、peerDependencies。只记录与当前问题直接有关的约束。',
      '折叠源码卡片，凭记忆写出完整 JSON 键路径和值的用途；再展开核对引号、层级和包名，避免用近似名字。',
    ]
  }
  if (path.endsWith('.yml')) {
    return [...common,
      '先看缩进：确定目标属于 patch 还是 insert，属于哪一个列表项。YAML 没有大括号，缩进就是父子关系。',
      '逐项标出 id、name、config、inject 和 disabled。id 是稳定定位行的标识，name 才是加载的插件模块，两者不能互换。',
      '看到 config 时先把它当作传给插件的输入，不根据字段名猜默认值；用本页讲义和其他嵌入卡片判断已给出的含义，未展示的默认值标为未知。',
      '比较目标前后的同级条目，判断顺序是否表达装配顺序。不要把文件中的相邻关系自动解释成函数调用。',
      '把 name 与本页其他卡片中的 package 或插件入口对应，把 id 与叠加图中的定位规则对应；页面没有展示的替换关系明确标为未知。',
      '折叠卡片重新画出三层缩进，并写出“这一层插入或替换了什么”。再展开时只核对层级和字段，不重读全部片段。',
    ]
  }
  return [...common,
    '在嵌入卡片中找到目标标题，读标题下第一段，写出该段试图回答的唯一问题。文档负责给地图，源码片段负责提供当前证据。',
    '把段落中的每个 package、类型和命令圈出来；只解释与今天观察题直接相关的第一个名字。',
    '区分定义句、规则句和例子。定义句回答“是什么”，规则句回答“必须怎样”，例子只帮助理解，不能替代规则。',
    '对照本页定位表与其他卡片检查路径和包名；若概览与源码片段的详细程度不同，以卡片中可见的当前代码为准。',
    '折叠卡片，用两句话复述：第一句给全局位置，第二句指出下一张需要阅读的卡片。再展开并核对专有名词。',
  ]
}

function renderEmbeddedSources(item, evidence) {
  return evidence.matches.map((match, index) => `<section class="embedded-source-card"><h5>目标 ${index + 1}：<code>${h(match.target)}</code></h5><p class="embedded-source-location"><code>${h(item.path)}:${match.index + 1}</code> · 摘录第 ${match.start}–${match.end} 行</p>${code(match.excerpt)}<p><b>这一行怎样读：</b>${h(declarationGuide(item.path, match.line))}</p></section>`).join('')
}

function declarationGuide(path, line) {
  if (path.endsWith('.json')) {
    return '这是一条 JSON 配置或清单记录。先从左侧键名判断读取者，再看右侧值；冒号只建立字段和值的关系，不表示函数调用。末尾逗号说明后面还有同级字段。'
  }
  if (path.endsWith('.yml')) {
    return '这是一条 YAML 配置记录。先数前导空格确定父级，再判断短横线是否开始新的列表项；字段出现的顺序便于阅读，但父子关系由缩进决定。'
  }
  if (path.endsWith('.md')) {
    return '这是文档中的标题或说明。它帮助你定位概念和阅读顺序，但运行行为仍要由本页嵌入的源码、清单或测试片段证明。把标题改写成一个问题，再带着问题进入下一张卡片。'
  }
  if (/\b(interface|type)\b/.test(line)) {
    return '这行声明 TypeScript 类型。它规定同进程代码可以怎样使用数据，但编译后不会自动检查磁盘、网络、模型或进程传来的 JSON。先找判别字段和必填字段，再看哪个函数生产或消费这种值。'
  }
  if (/\bclass\b/.test(line)) {
    return '这行声明运行时类。extends 表示继承现有实现，implements 表示承诺提供接口成员；接着应先读 constructor 注入的依赖和 public 方法，再决定是否需要看 private helper。'
  }
  if (/\b(function|async\s+function)\b|=>/.test(line)) {
    return '这行声明可执行函数。括号内是输入，冒号后的类型是输出；async 表示调用者得到 Promise，星号表示结果可分批 yield。先读签名预测行为，再用函数体和测试纠正预测。'
  }
  if (/\b(describe|it|test)\s*\(/.test(line)) {
    return '这行定义测试范围或行为案例。引号中的文字是要证明的可观察行为，不是实现步骤；先跳到最后一个关键 expect，再反向寻找触发它的那次调用。'
  }
  if (/\b(const|let|var)\b/.test(line)) {
    return '这行建立运行时值。先看右侧来自函数返回、服务属性还是字面量，再在当前卡片中找这个名字的读取位置；不要因为 const 就假设对象内部不可变化。'
  }
  return '这行是当前问题的检索锚点。先识别关键字、名字、括号和字符串，再读取它所在的完整声明；暂时无法分类时写“未知”，用上方 JSDoc 和下方第一处使用来确定职责。'
}

function renderReadingLens(item, evidence, readIndex, lesson) {
  const translations = evidence.matches.map(match => `<li><code>${h(match.line)}</code><p>${h(declarationGuide(item.path, match.line))}</p></li>`).join('')
  const previous = readIndex === 0 ? '今天的概念讲义' : `上一站“${lesson.reads[readIndex - 1].title}”`
  const next = readIndex === lesson.reads.length - 1 ? '本日运行跟踪表' : `下一站“${lesson.reads[readIndex + 1].title}”`
  return `<div class="reading-lens"><h4>先把目标行翻译成人话</h4><p><b>为什么从这里读：</b>${h(item.text)} 这一站只负责回答“${h(item.question)}”，不要顺手研究文件里的所有导出。</p><ul class="line-translations">${translations}</ul><h4>这一站的五个小关卡</h4><ol><li><b>进入前：</b>从${h(previous)}抄一个与你预计相关的名词，并写下你猜它会怎样出现在本文件。猜错没有关系，保留原答案。</li><li><b>读声明：</b>逐字说出目标行中的导出名、输入、输出或父级字段。不认识的语法先阅读卡片后的“这一行怎样读”，不需要另查资料。</li><li><b>读上下文：</b>在每张源码卡片中找出目标之前提供的条件，以及目标之后第一个可观察结果。片段没有展示的内容标为未知，不凭名字补全。</li><li><b>建立连接：</b>写一句“本文件把什么交给${h(next)}”。如果没有直接调用，就明确写成配置关系、类型关系或文档导航关系。</li><li><b>离开前：</b>折叠源码卡片，用 60 秒回答观察题。答案必须包含至少一个目标符号；答不出就展开对应卡片，只重读目标声明和它周围的直接调用。</li></ol></div>`
}

function renderKnowledgeWorkbook(lesson, deep) {
  return deep.terms.map(([name, definition], index) => {
    const topic = deep.lecture[index % deep.lecture.length]
    const read = lesson.reads[index % lesson.reads.length]
    const symbol = deep.symbols[index % deep.symbols.length]
    const trace = deep.trace[index % deep.trace.length]
    return `<article class="knowledge-unit"><h3>${index + 1}. ${h(name)}</h3><p><b>先用白话理解：</b>${h(definition)}</p><p><b>它为什么在今天出现：</b>“${h(topic[0])}”这一节讨论的是 ${h(topic[1][0])} 这里的 <code>${h(name)}</code> 不是孤立术语，它用来描述当前项目中的一个可观察关系。</p><p><b>在本页源码中寻找关系：</b>稍后阅读“${h(read.title)}”中的 <code>${h(symbol)}</code> 源码卡片。它不一定直接声明 <code>${h(name)}</code>；判断它是前置输入、实现、消费者、配置入口，还是没有直接关系。只有能说出具体关系时才把它记为证据，然后回答：“${h(read.question)}”</p><p><b>把它放进运行过程：</b>在“${h(trace[0])}”阶段，输入是“${h(trace[1])}”，代码会“${h(trace[2])}”，最后可观察到“${h(trace[3])}”。请判断 <code>${h(name)}</code> 是否真的参与这一阶段；若没有，写“无直接关系”，不要为了填满笔记强行关联。</p><div class="mini-assignment"><b>五分钟小练习：</b>不用复制定义，自己造一个句子：“在 DeepSeek Harness 中，${h(name)} 帮助 ______，因为 ______。”然后写一个反例：“如果把它误解成 ______，我会错误地去修改 ______。”</div></article>`
  }).join('')
}

function renderSourceStory(lesson, deep) {
  return lesson.reads.map((read, index) => {
    const evidence = sourceEvidence(read.path, deep.symbols[index])
    const first = evidence.matches[0]
    const previous = index === 0 ? '今天的概念输入' : `第 ${index} 站得到的结论`
    const next = index === lesson.reads.length - 1 ? '运行跟踪与项目实战' : `第 ${index + 2} 站“${lesson.reads[index + 1].title}”`
    return `<li><h3>第 ${index + 1} 站：${h(read.title)}</h3><p><b>带着什么进入：</b>${h(previous)}。你此时只需要知道 ${h(read.text)}</p><p><b>在源码哪里落地：</b>本页第 ${index + 1} 站已经嵌入 <code>${h(read.path)}:${first.index + 1}</code> 附近的 <code>${h(first.line)}</code>。它是进入正确声明的第一个锚点，不是整站答案。</p><p><b>这一站必须产出：</b>用一张纸回答“${h(read.question)}”，并写出一个输入、一个处理动作、一个输出。若答案没有包含目标符号 <code>${h(deep.symbols[index])}</code>，说明你仍在凭概念猜，没有用页面中的源码证明。</p><p><b>怎样交给下一站：</b>把本段结论压缩成一句“谁把什么交给谁”，然后进入${h(next)}。只有当下一站确实 import、调用、配置或消费它时才画实线；只是帮助理解时画虚线。</p></li>`
  }).join('')
}

function renderTraceWalkthrough(lesson, deep) {
  return deep.trace.map((row, index) => {
    const readIndex = index % lesson.reads.length
    const read = lesson.reads[readIndex]
    const evidence = sourceEvidence(read.path, deep.symbols[readIndex])
    const anchor = evidence.matches[0]
    return `<article><h3>${h(row[0])}</h3><p><b>进入这一步之前：</b>手上已有“${h(row[1])}”。先说出它来自用户、配置、上一个函数返回值、事件日志还是外部系统；不知道时回到第 ${readIndex + 1} 个源码站。</p><p><b>当前代码承担的责任：</b>${h(row[2])} 这句话要翻译成一个主语明确的动作，例如“解析器返回 invocation”或“Session 追加事件”，不要只写“系统处理”。</p><p><b>页面内的候选证据：</b>第 ${readIndex + 1} 个源码站嵌入了 <code>${h(read.path)}:${anchor.index + 1}</code> 附近的 <code>${h(anchor.target)}</code>。先判断它位于本阶段、前一阶段还是后一阶段；若页面没有展示当前动作的拥有者，就明确记录“当前摘录不足”，不要猜测。</p><p><b>怎样确认完成：</b>你应能观察到“${h(row[3])}”。如果实际结果不同，依次检查输入是否正确、目标分支是否执行、异步工作是否等待、结果是否通过事件而非 return 暴露。</p><div class="stage-record"><b>阶段记录：</b>输入 ______ → 真正拥有者/符号 ______ → 动作 ______ → 输出或事件 ______ → 失败由 ______ 观察。</div></article>`
  }).join('')
}

function commandPurpose(line) {
  if (/^pwd\b/.test(line)) return '打印终端当前目录。它不修改文件，用来确认后续相对路径从仓库根目录解析。'
  if (/^(node|pnpm) --version\b/.test(line)) return '读取本机工具版本。先核对运行环境，再判断后续失败是否来自项目代码。'
  if (/^rg\b/.test(line)) return '使用 ripgrep 搜索文件或文本。匹配结果通常是“路径:行号:内容”，它只负责定位，不证明整段行为。'
  if (/pnpm exec vitest/.test(line)) return '通过当前 workspace 的 Vitest 执行聚焦测试。文件路径限定范围，-t 后的文字只选择匹配标题。'
  if (/pnpm dsh/.test(line)) return '从根 package.json 的 dsh script 进入真实 CLI，再把后续参数交给参数解析器。'
  if (/pnpm run/.test(line)) return '让 pnpm 查找根 package.json 的同名 script，并在 workspace 环境中执行它。'
  if (/mktemp -d/.test(line)) return '创建临时目录并把路径保存到变量，避免实验污染真实 Harness home。'
  if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(line)) return '为这一条命令设置 shell 变量或环境变量。等号两边不能随意加空格；引号保护路径中的特殊字符。'
  return '这是只读定位或聚焦执行命令。先识别第一个单词代表的程序，再把剩余部分按选项、参数和搜索范围拆开。'
}

function commandSyntax(line) {
  const notes = []
  if (line.includes('|')) notes.push('竖线把左侧标准输出交给右侧命令，右侧只看到文本流。')
  if (line.includes('|| true')) notes.push('双竖线后的 true 把“没有匹配”变成可继续的实验结果，不代表前一条命令真的成功。')
  if (line.includes('&&')) notes.push('双与号只在左侧成功时执行右侧，因此右侧没有运行时先检查左侧退出码。')
  if (line.includes('$(')) notes.push('美元符号加括号先执行括号内命令，再把它的标准输出放回当前位置，这叫命令替换。')
  if (/^[A-Za-z_][A-Za-z0-9_]*=\S+\s+\S/.test(line)) notes.push('开头的 NAME=value 只为后面的这一条程序设置环境变量，不会永久修改 shell 配置。')
  if (line.includes('"')) notes.push('引号把内部空格或正则字符保留为一个参数；复制时不要漏掉成对引号。')
  if (line.includes('*')) notes.push('星号可能由 shell 展开为多个路径，也可能位于正则表达式中；结合引号判断由谁解释。')
  if (/\bhead\b/.test(line)) notes.push('head 只截取前几行，结果适合观察，不代表仓库中只有这些命中。')
  if (/\bsort\b/.test(line)) notes.push('sort 改变显示顺序，便于比较；它不改变原文件。')
  return notes.length ? notes.join(' ') : '这条命令没有额外 shell 连接符。按从左到右的顺序读取程序名、选项和位置参数。'
}

function renderCommandWorkshop(lesson, deep) {
  return lesson.lab.split('\n').map(line => line.trim()).filter(Boolean).map((line, index) => {
    const readIndex = index % lesson.reads.length
    const read = lesson.reads[readIndex]
    return `<article><h3>命令 ${index + 1}</h3>${code(line)}<p><b>它做什么：</b>${h(commandPurpose(line))}</p><p><b>这一行怎样拆：</b>${h(commandSyntax(line))}</p><p><b>和今天源码的关系：</b>执行前复习第 ${readIndex + 1} 个阅读站中已经嵌入的 <code>${h(read.path)}</code> 卡片，找到 <code>${h(deep.symbols[readIndex])}</code>。预测命令输出中哪一部分能帮助回答“${h(read.question)}”。</p><p><b>成功时记录什么：</b>记录退出码、第一条有意义的输出和它对应的源码路径。若没有输出，先判断是合法的“零匹配”，还是路径、正则、环境或命令本身错误。</p><p><b>失败时怎么查：</b>从错误第一行提取程序名和路径；确认当前目录；去掉管道或截断命令单独运行左侧；最后才怀疑项目行为。不要只截取错误末尾。</p></article>`
  }).join('')
}

function renderProjectReference(lesson, deep) {
  const rows = deep.project.checks.map((check, index) => {
    const readIndex = index % lesson.reads.length
    const read = lesson.reads[readIndex]
    const evidence = sourceEvidence(read.path, deep.symbols[readIndex])
    const anchor = evidence.matches[0]
    const trace = deep.trace[index % deep.trace.length]
    return `<tr><td>${h(check)}</td><td>第 ${readIndex + 1} 个阅读站<br><code>${h(read.path)}:${anchor.index + 1}</code><br><code>${h(anchor.target)}</code><br><small>请用页面内卡片确认它是否直接支持验收项</small></td><td>我在“${h(trace[0])}”阶段观察到输入“${h(trace[1])}”经过“${h(trace[2])}”，得到“${h(trace[3])}”。其中 ______ 与验收项直接相关；若无法填出，就写“当前页面证据不足”，不要补写猜测。</td></tr>`
  }).join('')
  return `<div class="reference-result"><h3>参考成果：一份合格记录长什么样</h3><p>这不是项目答案，而是证据记录的格式示范。表中位置都指向本页已经展示的源码卡片，不保证每一行都直接证明对应验收项。你必须把空白处替换成自己的观察；若候选卡片没有直接关系，就写“当前页面证据不足”。只写“我看懂了”不能验收。</p><div class="table-scroll"><table><thead><tr><th>验收项</th><th>页面内候选证据</th><th>演示时可以怎样说明</th></tr></thead><tbody>${rows}</tbody></table></div><h4>提交前自查</h4><ol><li>每个结论至少引用一张本页源码卡片、一个页面内运行阶段或一条实际命令结果。</li><li>图上的每条实线都能说出 import、调用、事件、配置或数据传递关系；推测使用虚线并标记待验证。</li><li>至少演示一个正常路径和一个失败或缺失输入路径。</li><li>回到第一张举证卡片，确认别人可以只靠本页在两分钟内复现你的解释。</li></ol></div>`
}

function renderSchedule(lesson) {
  const total = plannedMinutes(lesson)
  const weights = [0.1, 0.2, 0.35, 0.15]
  const minutes = weights.map(weight => Math.max(5, Math.round(total * weight / 5) * 5))
  minutes.push(Math.max(5, total - minutes.reduce((sum, value) => sum + value, 0)))
  const blocks = [
    ['热身', '读目标与术语，只圈出今天第一次见到的词。'],
    ['概念', '读三段讲义，每段写一句自己的解释。'],
    ['源码', '依次完成四个阅读站；每站结束就休息或保存进度。'],
    ['实验', '先预测，再运行命令，把输出对应到源码。'],
    ['项目与复盘', '完成基础产物、演示结果，并安排间隔复习。'],
  ]
  return blocks.map(([title, action], index) => `<li><b>${minutes[index]} 分钟 · ${title}</b><span>${action}</span></li>`).join('')
}

function plannedMinutes(lesson) {
  return Math.max(120, Number.parseInt(lesson.time, 10) + 60)
}

function plannedTimeLabel(lesson) {
  const minutes = plannedMinutes(lesson)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours} 小时${rest ? ` ${rest} 分钟` : ''}`
}

function readInstructions(path) {
  if (path.endsWith('.ts')) {
    return [
      '按本页源码卡片的目标顺序，读 JSDoc、参数和返回类型，不要从摘录第一行逐字硬读。',
      '只分析当前卡片可见的直接调用；复杂 helper 先记名字，页面未展示的实现标为未知。',
      '写下“调用者输入 → 当前符号处理 → 返回值或事件”，再用本页运行跟踪和参考成果校正。',
    ]
  }
  if (path.endsWith('.json')) {
    return [
      '在本页卡片中找到重点字段，确认它位于根对象、scripts、exports 还是 dependencies。',
      '把字段值拆成工具、参数或 package 名，不把整行当成一个黑盒。',
      '写下“哪个工具读取此字段 → 它影响什么”，再进入下一张页面内卡片。',
    ]
  }
  if (path.endsWith('.yml')) {
    return [
      '在本页卡片中找到目标 id 或字段，先用缩进确认它的父级和同级条目。',
      '分别记录 patch 操作、id、name、config/disabled，不根据名字猜实现。',
      '用本页其他清单或源码卡片确认插件存在，再说明后层如何定位这行；未展示的信息标为未知。',
    ]
  }
  return [
    '在本页卡片中找到目标标题，只读该段的开头、列表和直接链接文字。',
    '把文档结论与本章嵌入的源码或 manifest 卡片对应，不把概览当实现证据。',
    '写下这张卡片负责回答的问题，以及下一步应阅读的页面内源码站。',
  ]
}

function renderLesson(lesson, deep) {
  const day = lesson.day
  const previous = day > 1 ? `<a href="day-${String(day - 1).padStart(2, '0')}.html">← 第 ${day - 1} 天</a>` : '<a href="index.html">← 课程首页</a>'
  const next = day < 30 ? `<a href="day-${String(day + 1).padStart(2, '0')}.html">第 ${day + 1} 天 →</a>` : '<a href="index.html">完成课程 →</a>'
  const outcomes = lesson.outcomes.map(item => `<div>${h(item)}</div>`).join('')
  const terms = deep.terms.map(([name, text]) => `<dt>${h(name)}</dt><dd>${h(text)}</dd>`).join('')
  const lecture = deep.lecture.map(([title, paragraphs, example]) => `<section class="topic"><h3>${h(title)}</h3>${paragraphs.map(paragraph => `<p>${h(paragraph)}</p>`).join('')}${example ? `<div class="example"><b>具体例子</b>${example.includes('\n') ? code(example) : `<p>${h(example)}</p>`}</div>` : ''}</section>`).join('')
  const reads = lesson.reads.map((item, readIndex) => {
    const symbol = deep.symbols[readIndex]
    const instructions = readInstructions(item.path).map(step => `<li>${h(step)}</li>`).join('')
    const evidence = sourceEvidence(item.path, symbol)
    const evidenceRows = evidence.matches.map(match => `<tr><td><code>${h(match.target)}</code></td><td>${match.index + 1}</td><td><code>${h(match.line)}</code></td></tr>`).join('')
    const coaching = guidedReading(item.path, item.title, item.question).map((step, index) => `<li><b>第 ${index + 1} 步：</b>${h(step)}</li>`).join('')
    return `<li><h3>${h(item.title)}</h3><p class="source-line"><span><code>${h(item.path)}</code></span><a class="optional-source-link" href="../../${h(item.path)}" target="_blank">可选：查看完整本地文件</a></p><p>${h(item.text)}</p><div class="source-workbench"><h4>先定位：当前源码中的精确位置</h4><div class="table-scroll"><table><thead><tr><th>目标</th><th>当前行</th><th>这一行实际写了什么</th></tr></thead><tbody>${evidenceRows}</tbody></table></div><h4>逐个阅读：每个目标都有当前源码上下文</h4><div class="embedded-source-list">${renderEmbeddedSources(item, evidence)}</div>${renderReadingLens(item, evidence, readIndex, lesson)}<h4>逐行陪读：一次只完成一个动作</h4><ol class="coach-steps">${coaching}</ol><div class="note-template"><h4>这一站的源码笔记</h4><p><b>职责：</b>这段代码为什么存在？</p><p><b>输入：</b>参数、配置、事件或上游状态是什么？</p><p><b>输出：</b>返回值、写入数据或发出的事件是什么？</p><p><b>副作用：</b>是否注册服务、写日志、访问文件、发网络请求或启动进程？</p><p><b>失败：</b>错误由谁发现，怎样到达调用者或日志？</p><p><b>下一跳：</b>成功路径直接调用的下一个源码符号是什么？</p></div></div><h4>三遍阅读法</h4><ol class="micro-steps">${instructions}</ol><div class="observe"><b>闭卷回答：</b>${h(item.question)}</div><label><input type="checkbox" data-item="read-${readIndex}"> 我已阅读页面内全部目标卡片、填写六格笔记，并能闭卷回答观察题</label></li>`
  }).join('')
  const traceRows = deep.trace.map(row => `<tr>${row.map(cell => `<td>${h(cell)}</td>`).join('')}</tr>`).join('')
  const projectSteps = deep.project.steps.map((step, stepIndex) => {
    const read = lesson.reads[stepIndex % lesson.reads.length]
    const symbol = deep.symbols[stepIndex % deep.symbols.length]
    const check = deep.project.checks[stepIndex % deep.project.checks.length]
    const evidence = sourceEvidence(read.path, symbol)
    const anchor = evidence.matches[0]
    return `<li><h3>${stepIndex + 1}. ${h(step[0])}</h3><p><b>这一步解决什么：</b>你正在把“${h(deep.project.scenario)}”缩小成一个可完成动作。此时不要追求漂亮排版，先让每个结论都有证据。</p><p><b>你要做：</b>${h(step[1])}</p><p><b>第一处源码证据：</b>回到本页第 ${stepIndex % lesson.reads.length + 1} 个阅读站，查看 <code>${h(read.path)}:${anchor.index + 1}</code> 的 <code>${h(anchor.line)}</code> 卡片。再比较该站的其他目标卡片，判断它们是定义、调用、测试还是文档说明。</p><p><b>实际操作顺序：</b>先写下你预测的结果；再只查看目标声明和当前卡片中的一个直接使用点；随后完成产物中的这一小部分；最后把预测与源码事实并排，删掉没有证据的猜测。</p><p><b>必须留下的记录：</b><code>结论 → ${h(read.path)}:${anchor.index + 1} → ${h(anchor.target)} → 我观察到的输入/输出</code>。这条记录可直接由本页复核。</p><p><b>完成标志：</b>${h(check)}</p><p><b>自己验收：</b>折叠源码卡片，向一个没看过项目的人解释这一步。对方应能根据本页的阅读站、路径和符号重现证据。</p><p><b>卡住时：</b>退回第 ${stepIndex % lesson.reads.length + 1} 个源码站，只写一个“输入 → 处理 → 输出”关系。若 10 分钟仍无进展，把未知词加入清单，先完成不依赖它的部分，不同时阅读新的能力族。</p></li>`
  }).join('')
  const checks = deep.project.checks.map(item => `<li>${h(item)}</li>`).join('')
  const pitfalls = deep.pitfalls.map(([mistake, correction]) => `<details><summary>${h(mistake)}</summary><div><p>${h(correction)}</p></div></details>`).join('')
  const quiz = lesson.quiz.map((item, quizIndex) => `<details><summary>${quizIndex + 1}. ${h(item[0])}</summary><div><p>${h(item[1])}</p></div></details>`).join('')
  const prerequisites = deep.prerequisites.map(item => `<li>${h(item)}</li>`).join('')

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="DeepSeek Harness 源码学习课程第 ${day} 天：${h(lesson.title)}">
  <title>第 ${day} 天：${h(lesson.title)} | DeepSeek Harness 源码课</title>
  <link rel="stylesheet" href="assets/style.css">
  <link rel="stylesheet" href="assets/lesson.css">
</head>
<body data-day="${day}">
  <header><div class="hero"><p class="eyebrow">DeepSeek Harness · 30 天源码课</p><h1>第 ${day} 天：${h(lesson.title)}</h1><p>${h(lesson.summary)}</p></div></header>
  <div class="reading-bar" aria-label="页面阅读位置"><span id="reading-progress"></span></div>
  <div class="layout">
    <nav class="side" aria-label="本日目录"><strong>本日目录</strong><a href="index.html">课程地图</a><a href="#outcome">学习目标</a><a href="#lesson">概念讲义</a><a href="#reading">源码精读</a><a href="#trace">运行跟踪</a><a href="#lab">动手实验</a><a href="#project">项目实战</a><a href="#review">复盘自测</a><div class="day-meter">本日进度<div class="meter"><span id="day-progress"></span></div><span id="day-count"></span></div></nav>
    <main>
      <article>
        <section class="lesson-head" id="outcome"><div class="offline-contract"><b>离线阅读承诺：</b>本章所需概念、源码摘录、命令说明、项目步骤和参考材料均已嵌入页面。无需联网，也无需打开其他文件；源码链接仅供学完后的可选延伸阅读。</div><div class="meta">第 ${day} 天 · 建议分 2–3 次，共 ${plannedTimeLabel(lesson)}</div><h2>今天学完能做什么</h2><p>${h(lesson.summary)}</p><div class="outcomes">${outcomes}</div><h3>开始前检查</h3><ul>${prerequisites}</ul><h3>今天怎样安排，不赶进度</h3><ol class="lesson-schedule">${renderSchedule(lesson)}</ol><div class="patience"><b>随时可以停：</b>概念讲义、四个源码站、运行跟踪和项目实战都是独立存档点。建议第一次完成概念和前两站，第二次完成后两站与运行跟踪，第三次做项目。如果连续 10 分钟无法回答观察题，就把不懂的词写入“待补知识”，回到上一站，不用硬撑。学源码的成功标准是能用证据解释一小段，不是同一天读完所有内容。</div><div class="panel warning"><b>今天不要求掌握：</b>${h(deep.notYet)}。看到相关代码时先折叠或跳过，避免在错误的难度上消耗耐心。</div></section>
        <section id="lesson"><h2>一、从零开始的概念讲义</h2><p class="section-intro">先建立词义和因果关系，再阅读本页后面的源码卡片。下面每一节都要能用自己的话复述。</p>${lecture}<h3>术语速查</h3><dl class="term-grid">${terms}</dl><h3>把五个术语真正学会</h3><p class="section-intro">速查表只帮助你回忆。下面把每个词放回今天的源码和运行过程，并安排一个五分钟练习；完成后你应能解释它在这个项目中解决什么问题。</p><div class="knowledge-workbook">${renderKnowledgeWorkbook(lesson, deep)}</div><label class="wide-check"><input type="checkbox" data-item="concept"> 我已完成五个术语练习，并能用页面内源码解释它们</label></section>
        <section id="reading"><h2>二、按顺序精读真实源码</h2><p class="section-intro">以下片段由生成器从当前 checkout 读取。每个目标都有独立的行号与上下文；按“公共类型 → 最小行为 → 实现”的顺序在本页阅读即可。</p><ol class="steps">${reads}</ol><div class="source-story"><h3>把四个源码站串成一条主线</h3><p>单独看懂四个声明还不够。下面再走一次，但每站只保留“带着什么进入、在哪里落地、必须产出什么、怎样交给下一站”，帮助你把文件列表变成调用或装配关系。</p><ol>${renderSourceStory(lesson, deep)}</ol></div></section>
        <section class="panel" id="trace"><h2>三、把代码还原成运行过程</h2><p>${h(deep.traceIntro)}</p><div class="table-scroll"><table><thead><tr><th>阶段</th><th>输入</th><th>当前代码做什么</th><th>输出或可观察结果</th></tr></thead><tbody>${traceRows}</tbody></table></div><h3>逐阶段带你走一遍</h3><p>先读一段，再回上表指认对应单元格。每一段都给出一个当前源码入口和一行阶段记录模板；不要跳过“怎样确认完成”，否则你只知道代码可能做什么，不知道怎样验证。</p><div class="trace-walkthrough">${renderTraceWalkthrough(lesson, deep)}</div><div class="trace-drill"><h3>闭卷运行跟踪练习</h3><ol><li>先遮住上表，只在纸上写出第一阶段的输入。</li><li>为每一阶段画一个方框；方框里只能写“拥有这一步的文件或符号”和一个动词。</li><li>用箭头连接输出与下一阶段输入。若两个格子连不上，回到对应源码站找 return、await、事件名或配置字段。</li><li>选一个失败点，用红色写出错误在哪里出现、谁能观察它，以及后续阶段是否还会执行。</li><li>最后对照上表纠正，不擦掉错误答案；错误能告诉你下一次该复习哪个符号。</li></ol><p><b>合格答案：</b>你能不看页面说出至少四个阶段，并且每条箭头都有一个当前源码符号作为证据。只会背表格文字还不算完成。</p></div><label><input type="checkbox" data-item="trace"> 我已完成阶段记录、闭卷重画并标出一个失败分支</label></section>
        <section class="panel lab" id="lab"><h2>四、动手实验</h2><p>在仓库根目录运行。第一遍先写下预测，第二遍执行，第三遍把输出对应到刚读过的源码。命令失败时保留完整错误，不要猜测成功输出。</p>${code(lesson.lab)}<h3>命令逐条拆解</h3><p>下面不会替你编造固定输出，而是解释每条命令由谁执行、参数怎样读取、应该观察什么。仓库内容和本机环境会变化，实际运行结果才是你的证据。</p><div class="command-workshop">${renderCommandWorkshop(lesson, deep)}</div><h3>实验记录模板</h3><ol><li>我预测会看到：</li><li>实际看到：</li><li>第一个与预测不同的地方：</li><li>这个差异属于环境、参数解析、配置、运行时还是测试断言：</li><li>支持结论的源码路径和行号：</li><li>下次只需重做的最小命令：</li></ol><label><input type="checkbox" data-item="lab"> 我已逐条理解命令，完成预测、执行和结果归因</label></section>
        <section class="project" id="project"><div class="project-kicker">连续项目实战</div><h2>五、${h(deep.project.title)}</h2><p><b>场景：</b>${h(deep.project.scenario)}</p><p><b>最终产物：</b>${h(deep.project.output)}</p><div class="project-rule"><b>先建立证据再制作产物：</b>项目不是抄写示例。每完成一步，都要在产物旁写出源码路径、目标符号和一句因果解释。若结论不能指向今天四个阅读站之一，先把它标成“待验证”，不要伪装成确定事实。</div><ol class="project-steps">${projectSteps}</ol>${deep.project.code ? `<h3>起步代码或记录格式</h3><p>下面只给你一个空白骨架。先凭记忆填一遍，再用本页源码卡片补证据；不要把省略号当作最终答案。</p>${code(deep.project.code)}` : ''}${renderProjectReference(lesson, deep)}<h3>验收标准</h3><ul class="acceptance">${checks}</ul><h3>怎样演示你的项目</h3><ol><li>先用 30 秒说明问题和最终产物，不讲实现细节。</li><li>展示产物中的第一条结论，再回到本页引用的源码卡片，证明名称和职责不是猜的。</li><li>展示一次输入如何经过至少两个阶段变成输出；指出中间的类型、事件、配置或服务调用。</li><li>故意改变一个安全的输入或查询条件，重新执行实验，解释结果为什么变化。不要修改仓库产品源码。</li><li>请听众从验收标准中任选一条检查；无法证明的条目标为未完成，回到对应步骤补证据。</li></ol><details><summary>做完基础版后再看：进阶挑战</summary><div><p>${h(deep.project.stretch)}</p></div></details><label class="wide-check"><input type="checkbox" data-item="project"> 项目基础版达到全部验收标准，并完成一次页面内源码证据演示</label></section>
        <section id="review"><h2>六、常见误区与自测</h2><h3>小白最容易卡住的地方</h3>${pitfalls}<h3>闭卷自测</h3><p>先在纸上回答，再展开答案。答错不是失败；回到本页对应源码站的卡片找证据。</p>${quiz}<h3>今天的口述复盘</h3><ul>${deep.review.map(item => `<li>${h(item)}</li>`).join('')}</ul><h3>间隔复习安排</h3><div class="review-grid"><section><h4>10 分钟后</h4><p>不看页面，写出今天四个文件和每个文件的一个目标符号。漏掉的只回看定位表，不重读全部卡片。</p></section><section><h4>24 小时后</h4><p>重新画运行表，任选一条箭头说出输入、处理和输出。然后执行今天的命令，用实际输出纠正记忆。</p></section><section><h4>7 天后</h4><p>重新阅读本页四个源码站，检查自己能否根据嵌入片段找回目标和上下文。用三分钟向另一个初学者解释今天的项目，并回答一个“为什么”。</p></section></div><ul class="checklist"><li><label><input type="checkbox" data-item="explain"><span>我能在 3 分钟内口述今天的运行链</span></label></li><li><label><input type="checkbox" data-item="notes"><span>我给四个源码站都写了职责、输入、输出、副作用、失败和下一跳</span></label></li><li><label><input type="checkbox" data-item="done"><span>完成第 ${day} 天，并已安排 24 小时复习</span></label></li></ul></section>
        <nav class="day-nav" aria-label="日课导航">${previous}<a href="index.html">课程地图</a>${next}</nav>
      </article>
    </main>
  </div>
  <footer><div><a href="index.html">返回 30 天课程地图</a> · 正文为静态 HTML，JavaScript 只保存学习进度。</div></footer>
  <script src="assets/course.js"></script>
</body>
</html>
`
}
