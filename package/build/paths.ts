import path from 'path'
// path.resolve的理解
// 从后向前，若字符以 / 开头，不会拼接到前面的路径；
// 若以 ../ 开头，拼接前面的路径，且不含最后一节路径；
// 若以 ./ 开头 或者没有符号 则拼接前面路径；
export const pathRoot = path.resolve(__dirname, '..')
export const pathSrc = path.resolve(pathRoot, 'src')    //生成在父目录的src文件夹下
// export const pathOutput = path.resolve(pathRoot, 'dist')