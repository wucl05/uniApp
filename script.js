const fs = require('fs')
const shell = require('shelljs')
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
//getPageJson("pages/tabBar/API/API")
//addPage("pages.json")
console.log("npm")