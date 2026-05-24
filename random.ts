import fs from "node:fs"
import path from "node:path"

const clientComponents:Record<string,string> = {}

function findClientComponents(dir:string){
    const files = fs.readdirSync(dir)
    for(const file of files){
        const filePath = path.join(dir,file)
        const stats = fs.statSync(filePath)
        if(stats.isFile()){
            const content = (fs.readFileSync(filePath,"utf-8")).trimStart()
            let firstLine = content.split("\n")[0]
            firstLine = firstLine.slice(0,firstLine.length-1)
            if(firstLine==='"use client"' || firstLine==="'use client'"){
                clientComponents[filePath] = filePath
            }
        }
        else{
            findClientComponents(filePath)
        }
   
    }
}

findClientComponents("./src")
console.log(clientComponents);