const fs = require('fs')
const { exec } = require('child_process');
const { join,dirname,basename,extname } = require('path');
const ncp = require('ncp').ncp
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
const addPage = async function(fileName){
    let pagesJson = await read(fileName)
    pagesJson = pagesJson.replace(/\{\s*\"pages\"\:\s*\[/g,`{\r\n\t"pages":[\r\n\t\t{\r\n\t\t\t"path":"pages/test/hhh",\r\n\t\t\t"sytle":{}\r\n\t\t},`)
    save(fileName,pagesJson)
}
const getPageJson = async function(pagePath){
    let pagesJSON = await read("pages.json")
    console.log(pagesJSON)
    pagesJSON = pagesJSON.replace(/(\/\/[\s\S]*?\n)|(\/\*{1,2}[\s\S]*?\*\/)/g,"")
    pagesJSON = JSON.parse(pagesJSON)
    for(let path of pagesJSON.pages){
        console.log("path:",path.path)
    }
}

const delDir = function(path){
    let files = [];
    if(fs.existsSync(path)){
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()){
                delDir(curPath); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });
        fs.rmdirSync(path);
    }
}

const cloneGit = function(gitUrl){
    return new Promise((resolve,reject)=>{
        delDir("c:/cloneGitRepositoryTemp")
        exec(`git clone ${gitUrl || "git@github.com:wucl05/uniApp.git"} c:/cloneGitRepositoryTemp`,(err,stdout,stderr)=>{
            console.log("err",err)
            if(!err){
                console.log(`clone success`)
                resolve(true)
            }else{
                console.log(`clone error`)
                resolve(false)
            }
        })
    })
   
}

const clone =async function(git,pagePath){
    const res =await cloneGit(git)
    if(res){
        pagePath = /.vue$/g.test(pagePath)?pagePath:`${join(pagePath)}.vue`
        await relyon(pagePath)
        // const fileName = join("c:/cloneGitRepositoryTemp",pagePath)
        // const pageCode =await read(fileName)
        // const importArr = getimportPath(pageCode,pagePath)
        // const imgArr = getimgSrc(pageCode,pagePath)
        // const bgArr = getbackgroundUrl(pageCode,pagePath)
        // console.log("importArr",importArr)
        // console.log("imgArr",imgArr)
        // console.log("bgArr",bgArr)
        // const fileArr = importArr.files.concat(imgArr,bgArr)
        // console.log("fileArr:",fileArr)
        // fileArr.forEach(async item=>{
        //     if(await copy(item.from,item.to)){
        //         console.log(basename(item.to))
        //     }
        // })
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
        console.log("fileName：",fileName)
        console.log("filePath:",filePath)
        console.log("full:",full)
        const pageCode =await read(fileName)
        const importArr = getimportPath(pageCode,filePath)
        const imgArr = getimgSrc(pageCode,filePath)
        const bgArr = getbackgroundUrl(pageCode,filePath)
        console.log('importArr:',importArr)
        console.log('imgArr:',imgArr)
        console.log('bgArr:',bgArr)
        

        const fileArr = importArr.files.concat(imgArr,bgArr)
        for(let i=0;i<fileArr.length;i++){
            let item = fileArr[i]
            console.log("from:",item.from)
            console.log("from exit",extname(item.from))
            const exts = ['.vue','.js','.css','.less']
            if(exts.includes(extname(item.from))){
                console.log("递归",item.from)
                await relyon(item.from,true)
            }
            if(await copy(item.from,item.to)){
                console.log(basename(item.to))
            }
        }
        const to = join(__dirname,filePath)
        await copy(fileName,to)
        console.log(basename(to))
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
        console.log("tmp:",tmp)
        if(tmp.indexOf("/")>=0){
            if(tmp.indexOf("../")>=0 || tmp.indexOf("./")>=0){
                const dirArr = pagePath.split("\\")
                dirArr.splice(dirArr.length-1,1)
                const pathTemp = dirArr.join("/")
                console.log("dirArr:",dirArr)
                console.log('pathTemp:',pathTemp)
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
    //const str = await read('c:/cloneGitRepositoryTemp/pages/test/test.vue')
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
    //const str = await read('c:/cloneGitRepositoryTemp/pages/test/test.vue')
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
//console.log(join("c:/cloneGitRepositoryTemp",'../common/city.data.js'))
relyon('pages/test/test.vue')
//copy('c:/uni.png', 'd:/111111/uni.png')
// ncp('c:/uni.png', 'd:/111111/uni.png', function (err) {
//     if (err) {
//       return console.error(err);
//     }
//     console.log('done!');
// });
//getbackgroundUrl("",'pages/test/test')
//getimgSrc("",'pages/test/test')
//clone("git@github.com:wucl05/uniApp.git","pages/test/test")
//getPageJson("pages/tabBar/API/API")
//addPage("pages.json")
// cloneGit()
//console.log(__dirname)
//console.log(join("c:/cloneGitRepositoryTemp",'/static/lock.png'))
//console.log(basename("c:/cloneGitRepositoryTemp/lock.png"))

