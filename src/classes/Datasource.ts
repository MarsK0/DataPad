import fs from "node:fs";
import { Entries } from "../models/Entries";

export default class Datasource<T extends object & T extends any[] ? never : object>{

  private dataSource: string
  private data: T[];

  constructor(
    datasourcePath: string,
    datasourceName: string
  ){

    if(!fs.existsSync(datasourcePath)) fs.mkdirSync(datasourcePath)

    this.dataSource = `${datasourcePath}/${datasourceName}.json`;

    const datasourceIsCreated: boolean = fs.existsSync(this.dataSource)

    if(datasourceIsCreated){
    
      const rawRetrievedData = fs.readFileSync(this.dataSource);
      const retrievedData = rawRetrievedData.toString();

      this.data = JSON.parse(retrievedData) as T[]

      return;
    }

    this.data = []

    fs.writeFileSync(this.dataSource, JSON.stringify(this.data))

  }

  insert(data: T): void{

    this.data.push(data)

    fs.writeFileSync(this.dataSource, JSON.stringify(this.data))

  }

  selectWhere<P extends Partial<T>, K extends keyof T, R extends Pick<T, K>>(entries?: Entries<P, K>): R[]|T[]{

    const params = entries?.params ? entries.params : undefined
    const fields = entries?.fields ? entries.fields : undefined

    const queryFilter = params
    ? this.data.filter(data => {
      return Object.entries(params).every(([key, value]) => data[key as keyof typeof data] === value)
    })
    : this.data

    if(!fields) return queryFilter

    const queryResult = queryFilter.map(data => {

      const selectedData: R = {} as R

      fields.forEach(field => {

        selectedData[field] = data[field] as unknown as R[K]

      })

      return selectedData

    })

    return queryResult

  }

  deleteWhere<P extends Partial<T>>(params: P): void{

    const queryResult = this.data.filter(data => {
      Object.entries(params).every(([key, value]) => data[key as keyof typeof data] != value)
    })

    this.data = queryResult

    fs.writeFileSync(this.dataSource, JSON.stringify(this.data))
  }

  updateWhere<P extends Partial<T>, U extends Partial<T>>(params: P, update: U): void{

    this.data.forEach((data, index) => {

      const paramsMatch = Object.entries(params).every(([key, value]) => data[key as keyof typeof data] === value)

      if(paramsMatch){

        this.data[index] = { ...data, ...update }

      }

    })

    fs.writeFileSync(this.dataSource, JSON.stringify(this.data))

  }

}
