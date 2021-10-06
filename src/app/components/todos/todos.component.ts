import { Component, OnInit } from '@angular/core';
import {todo} from './../../Models/todo'

@Component({
  selector: 'app-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css']
})
export class TodosComponent implements OnInit {

todos:todo[];
inputTodo:string="";
editTask:number=null;
  constructor() { }

  ngOnInit(): void {
   this.todos=[
     {
      content:"first todo",
      completed:false
     },
     {
       content:"2nd todo",
       completed:true
     }
   ]
  }
  toogleDone(id){
    this.todos.map((v,i)=>{
      if(i==id){
        v.completed=!v.completed;
      }
      return v;
    })
  }

  deleteTodo(id){
    this.todos=this.todos.filter((v,i)=> i!=id);
  }
  addTodo(){
    if(this.editTask==null){
    this.todos.push({
      content:this.inputTodo,
      completed:false
    })
    this.inputTodo=""
  }else{
    this.todos[this.editTask].content=this.inputTodo;
    this.editTask=null;
    this.inputTodo="";
  }
  }
  updateTodo(id){
    this.todos.map((v,i)=>{
      if(i==id){
        this.inputTodo=v.content
        this.editTask=i;
      }

    })
    
  }

}
