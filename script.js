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
        console.log("pageCode:",pageCode)
        const importArr = getimportPath(pageCode)
        console.log("importArr",importArr)
    }else{
        new Error("clone error")
    }
}
const getimportPath = function(str){
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
            resArr.files.push(tmp)
        }else{
            resArr.pack.push(tmp)
        }
    })
    return resArr
}
clone("git@github.com:wucl05/uniApp.git","pages/test/test")
//getPageJson("pages/tabBar/API/API")
//addPage("pages.json")
// cloneGit()


