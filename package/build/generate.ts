import glob from 'fast-glob'  // 根据路径与文件类型读取文件名
import consola from 'consola' // 控制台输出样式
import chalk from 'chalk'     // 控制开输出颜色
import path from 'path'       
import camelcase from 'camelcase' // 控制命名规则
import { getPackageInfo } from 'local-pkg'// 获取本地npm包的信息
import { format } from 'prettier'// 代码规范
import type { BuiltInParserName } from 'prettier'
import { emptyDir } from 'fs-extra'// 文件系统额外操作，清空文件夹而不删除文件夹
import { readFile, writeFile } from 'fs/promises'
import { pathSrc } from './paths'

/**
 * 根据bootstrap-icons包的packageInfo获取svg文件绝对路径
 * @returns svg文件绝对路径数组
 */
const getSvgFilesPath = async() => {
    const packageInfo  = await getPackageInfo('bootstrap-icons')
    let iconsPath = packageInfo?.rootPath + '\\icons'
    return glob('*.svg',{ cwd: iconsPath, absolute: true})
}

/**
 * 根据svg文件名拆分出
 * @param file svg文件名
 * @returns 
 */
const getName = (file: string) => {
    // 提取svg的文件名
    const filename = path.basename(file).replace('.svg','')
    // 将kebab-case的格式转化为PascalCase格式
    const componentName = camelcase(filename, { pascalCase: true })
    return {
        filename,
        componentName,
    }
}

/**
 * 利用 prettier 格式化代码
 * @param code 
 * @param parser 
 * @returns 
 */
const formatCode = (code: string, parser: BuiltInParserName = 'typescript') =>
  format(code, {
    parser,
    semi: false,
    singleQuote: true,
})

/**
 * 生成vue文件
 * @param file svg文件绝对路径数组
 */
const transformToVueComponent = async(file: string)=>{
    const content = await readFile(file, 'utf-8')       // svg组件内容
    const { filename, componentName } = getName(file)   // 文件名与组件名
    // 代码格式化后的vue模板
    const vue = formatCode(
        `
    <template>
    ${content}
    </template>
    <script lang="ts">
      import { defineComponent } from 'vue'
      export default defineComponent({
        name: "${componentName}",
      })
    </script>`,
        'vue'
    )
    
    writeFile(path.resolve(pathSrc, `${filename}.vue`), vue, 'utf-8')
}

/**
 * 生成 index.ts 入口文件
 * @param files svg文件绝对路径数组
 */
const generateEntry = async (files: string[]) => {
    const code = formatCode(
      files
        .map((file) => {
          const { filename, componentName } = getName(file)
          return `export { default as ${componentName} } from './${filename}.vue'`
        })
        .join('\n')
    )
    await writeFile(path.resolve(pathSrc, 'index.ts'), code, 'utf-8')
  }


(async () => {
    consola.info(chalk.blue('start generating vue components'))
    // 清空vue文件生成文件夹
    await emptyDir(pathSrc)
    const files = await getSvgFilesPath()
    consola.info(chalk.blue('generating vue files'))
    await Promise.all(files.map((file) => transformToVueComponent(file)))
    consola.info(chalk.blue('generating entry file'))
    await generateEntry(files)
    consola.success(chalk.green('generated vue components'))
})()