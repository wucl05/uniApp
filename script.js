const fs = require('fs')
const { exec } = require('child_process');
const { join } = require('path');
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
        const fileName = join("c:/cloneGitRepositoryTemp",pagePath)
        const pageCode =await read(fileName)
        const importArr = getimportPath(pageCode,pagePath)
        console.log("importArr",importArr)
    }else{
        new Error("clone error")
    }
}
const getimportPath = function(str,pagePath){
    const arr1 = str.match(/import\s?\w*\s?from\s?\s\S*('|")/g)
    const arr2 = str.match(/@import\s?\s\S*('|")/g)
    const resArr = {
        files:[],
        pack:[]
    }
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
const getimgSrc = async function(str,pagePath){
    const res = await read('c:/cloneGitRepositoryTemp/pages/test/test.vue')
    const imagesSrc = res.match(/<image\b.*?(?:\>|\/>)/g)
    const srcs = []
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
    console.log("srcs:",srcs)
    return srcs
}
const getbackgroundUrl = function(){
    const res = await read('c:/cloneGitRepositoryTemp/pages/test/test.vue')
    const imagesSrc = res.match(/url\s?\(.*?(\))\s?/g)
    console.log("imagesSrc",imagesSrc)
}
getimgSrc("",'pages/test/test')
//clone("git@github.com:wucl05/uniApp.git","pages/test/test")
//getPageJson("pages/tabBar/API/API")
//addPage("pages.json")
// cloneGit()
//console.log(__dirname)
//console.log(join("c:/cloneGitRepositoryTemp",'/static/lock.png'))


