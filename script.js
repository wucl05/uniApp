const fs = require('fs')
const { exec } = require('child_process');
const { join,dirname,basename,extname } = require('path');
const ncp = require('ncp').ncp
const colors = require('colors')
const read = function(fileName){
    return new Promise((resolve,reject)=>{
        fs.readFile(fileName,"utf-8",function(err,data){
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
        })
    })
}
const save = function(fileName,data){
    return new Promise((resolve,reject)=>{
        fs.writeFile(fileName, data, 'utf-8', (err) => {
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
          })
    })
}
const addPage = async function(pagePath){
    const pageJson = await getPageJson(pagePath)
    const fileName = join(__dirname,"pages.json")
    let pagesJson = await read(fileName)
    pagesJson = pagesJson.replace(/\{\s*\"pages\"\:\s*\[/g,`{\r\n\t"pages":[\r\n\t\t{\r\n\t\t\t"path":"${pageJson.path}",\r\n\t\t\t"sytle":${JSON.stringify(pageJson.style)}\r\n\t\t},`)
    console.log(colors.green('✔ '),"add page router")
    save(fileName,pagesJson)
}
const getPageJson = async function(pagePath){
    return new Promise(async (resolve,reject)=>{
        let pagesJSON = await read("c:/cloneGitRepositoryTemp/pages.json")
        pagesJSON = pagesJSON.replace(/(\/\/[\s\S]*?\n)|(\/\*{1,2}[\s\S]*?\*\/)/g,"")
        pagesJSON = JSON.parse(pagesJSON)
        for(let path of pagesJSON.pages){
            if(path.path===pagePath){
                resolve(path)
                return
            }
        }
    }) 
}

const delDir = function(path){
    let files = [];
    if(fs.existsSync(path)){
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()){
                delDir(curPath); 
            } else {
                fs.unlinkSync(curPath); 
            }
        });
        fs.rmdirSync(path);
    }
}

const npm = function(packName){
    return new Promise((resolve,reject)=>{
        exec(`cnpm i ${packName} --save`,(err,stdout,stderr)=>{
            if(!err){
                console.log(colors.green('✔ '),`install pack ${packName} success`)
                resolve(true)
            }else{
                console.log(`install pack error`)
                resolve(false)
            }
        })
    })
}

const clone =async function(git,pagePath){
    console.log(colors.green(`❤  clone page ${pagePath} from ${git} ❤`))
    const res =await cloneGit(git)
    if(res){
        console.log(colors.green('✔ '),`git repository download successfully `)
        const fileName = /.vue$/g.test(pagePath)?pagePath:`${join(pagePath)}.vue`
        await relyon(fileName)
        addPage(pagePath)
        
    }else{
        new Error("clone error")
    }
}
const relyon = async function(filePath,full){
    return new Promise(async (resolve,reject)=>{
        if(full){
            const tmp = 'c:\\cloneGitRepositoryTemp\\'
            filePath = filePath.substr(tmp.length,filePath.length-tmp.length)
        }
        const fileName = join("c:/cloneGitRepositoryTemp",filePath)
        const pageCode =await read(fileName)
        const importArr = getimportPath(pageCode,filePath)
        const imgArr = getimgSrc(pageCode,filePath)
        const bgArr = getbackgroundUrl(pageCode,filePath)
        const fileArr = importArr.files.concat(imgArr,bgArr)
        for(let i=0;i<importArr.pack.length;i++){
            await npm(importArr.pack[i])
        }
        for(let i=0;i<fileArr.length;i++){
            let item = fileArr[i]
            const exts = ['.vue','.js','.css','.less']
            if(exts.includes(extname(item.from))){
                await relyon(item.from,true)
            }
            if(await copy(item.from,item.to)){
                console.log(colors.green('✔ '),basename(item.to))
            }
        }
        const to = join(__dirname,filePath)
        await copy(fileName,to)
        console.log(colors.green('✔ '),basename(to))
        resolve()
    })
}
const getimportPath = function(str,pagePath){
    let arr1 = str.match(/import\s?\w*\s?from\s?\s\S*('|")/g)
    let arr2 = str.match(/@import\s?\s\S*('|")/g)
    const resArr = {
        files:[],
        pack:[]
    }
    if(!arr1) arr1=[]
    if(!arr2) arr2=[]
    arr1.concat(arr2).forEach((item)=>{
        let tmp = item.match(/(['"])(?:(?!\1).)*?\1/g)[0]
        tmp = tmp.substr(1,1)=="@"?tmp.substr(2,tmp.length-3):tmp.substr(1,tmp.length-2)
        if(tmp.indexOf("/")>=0){
            if(tmp.indexOf("../")>=0 || tmp.indexOf("./")>=0){
                const dirArr = pagePath.split("\\")
                dirArr.splice(dirArr.length-1,1)
                const pathTemp = dirArr.join("/")
                resArr.files.push({
                    from:join("c:/cloneGitRepositoryTemp",pathTemp,tmp),
                    to:join(__dirname,pathTemp,tmp)
                })
            }else{
                resArr.files.push({
                    from:join("c:/cloneGitRepositoryTemp",tmp),
                    to:join(__dirname,tmp)
                })
            }
            
        }else{
            resArr.pack.push(tmp)
        }
    })
    return resArr
}
const getimgSrc =function(str,pagePath){
    let imagesSrc = str.match(/<image\b.*?(?:\>|\/>)/g)
    const srcs = []
    if(!imagesSrc) imagesSrc = []
    imagesSrc.forEach(item=>{
        let src = item.match(/src\s?=\s?[\'\"]?([^\'\"]*)[\'\"]?/g)[0]
        src = src.match(/(['"])(?:(?!\1).)*?\1/g)[0]
        const dirArr = pagePath.indexOf("/")>=0?pagePath.split("/"):pagePath.split("\\")
        dirArr.splice(dirArr.length-1,1)
        const pathTemp = dirArr.join("/")
        src = src.substr(1,src.length-2)
        if(src.indexOf("../")>=0 || src.indexOf("./")>=0){
            srcs.push({
                from:join("c:/cloneGitRepositoryTemp",pathTemp,src),
                to:join(__dirname,pathTemp,src)
            })
        }else{
            srcs.push({
                from:join("c:/cloneGitRepositoryTemp",src),
                to:join(__dirname,src)
            })
        }
    })
    return srcs
}
const getbackgroundUrl =function(str,pagePath){
    let imagesSrc = str.match(/url\s?\(.*?(\))\s?/g)
    const srcs = []
    if(!imagesSrc) imagesSrc = []
    imagesSrc.forEach(src=>{
        src = src.match(/(['"])(?:(?!\1).)*?\1/g)[0]
        const dirArr = pagePath.indexOf("/")>=0?pagePath.split("/"):pagePath.split("\\")
        dirArr.splice(dirArr.length-1,1)
        const pathTemp = dirArr.join("/")
        src = src.substr(1,src.length-2)
        if(!src.match(/^\s?(http|https):\/\//g)){
            if(src.indexOf("../")>=0 || src.indexOf("./")>=0){
                srcs.push({
                    from:join("c:/cloneGitRepositoryTemp",pathTemp,src),
                    to:join(__dirname,pathTemp,src)
                })
            }else{
                srcs.push({
                    from:join("c:/cloneGitRepositoryTemp",src),
                    to:join(__dirname,src)
                })
            }
        }
    })
    return srcs
}
const createDir = (name)=>{
    if (fs.existsSync(name)) {
        return true;
    } else {
        if (createDir(dirname(name))) {
            fs.mkdirSync(name);
            return true;
        }
    }
}
const copy = async (from,to)=>{
    return new Promise((resolve,reject)=>{
        createDir(dirname(to))
        ncp(from, to, function (err) {
            if (err) {
                resolve(false)
                return console.error(err);
            }
            resolve(true)
        });
    })
}

const cloneGit = function(gitUrl){
    return new Promise((resolve,reject)=>{
        delDir("c:/cloneGitRepositoryTemp")
        exec(`git clone ${gitUrl || "git@github.com:wucl05/uniApp.git"} c:/cloneGitRepositoryTemp`,(err,stdout,stderr)=>{
            if(!err){
                resolve(true)
            }else{
                console.log(`clone error`)
                resolve(false)
            }
        })
    })
   
}

const cmd = function(code,opt={}){
    return new Promise((resolve,reject)=>{
        exec(code,opt,(err,stdout,stderr)=>{
            if(!err){
                resolve(true)
            }else{
                resolve(false)
            }
        })
    })
}

const init = async (git)=>{
    const res = await cloneGit(git || 'git@github.com:wucl05/public.git')
    if(res){
       const c = await copy('c:/cloneGitRepositoryTemp/public_common',join(__dirname,"public_common"))
       if(c){
        console.log(colors.green('✔ '),`publicCommon download successfully`)
       }
    }
}
const update = async (git)=>{
    const res = await cloneGit(git || 'git@github.com:wucl05/public.git')
    if(res){
        const c = await copy(join(__dirname,"public_common"),'c:/cloneGitRepositoryTemp/public_common')
        if(c){
            await cmd("git add *",{cwd:'c:/cloneGitRepositoryTemp'})
            await cmd("git commit -m 'update'",{cwd:'c:/cloneGitRepositoryTemp'})
            await cmd("git push origin master",{cwd:'c:/cloneGitRepositoryTemp'})
            console.log(colors.green('✔ '),`update publicCommon successfully`)
        }else{
            console.log(colors.red('✖ '),`update publicCommon failed`)
        }
        
    } 
}
const run = process.argv[2]
const giturl = process.argv[3]
const pagePath = process.argv[4]
if(run==="clone"){
    clone(giturl,pagePath)
}else if(run==="init"){
    init()
}else if(run==="update"){
    update()
}




