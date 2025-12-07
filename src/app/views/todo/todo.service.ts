import { TagItem } from './../../shared/models/todo.model';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { TodoItem } from 'app/shared/models/todo.model';
import { debounceTime, switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class TodoService {

  searchTerm: BehaviorSubject<string> = new BehaviorSubject<string>('');
  sub: Subscription;
  
  // Local storage for todos (mock data removed)
  private todoList: TodoItem[] = [];
  private tagList: TagItem[] = [];

  constructor(private http: HttpClient) {
    // Mock data removed - implement real API calls when backend is ready
  }

  getTodoList() {
    // TODO: Implement real API call when backend is ready
    // return this.http.get("/api/todoList");
    return of(this.todoList);
  }

  getTodoById(id) {
    // TODO: Implement real API call when backend is ready
    // return this.http.get("/api/todoList/"+id);
    return of(this.todoList.find(todo => todo.id === +id));
  }

  getTagList() {
    // TODO: Implement real API call when backend is ready
    // return this.http.get("/api/todoTag");
    return of(this.tagList);
  }

  updateSearchTerm(term: string) {
    this.searchTerm.next(term);
  }

  getSearchTerm() {
    return this.searchTerm;
  }

  saveTag(tag: TagItem) {
    let newTag: TagItem = {
      id: Math.floor(Math.random() * 9000) + 1000,
      ...tag
    }
    this.tagList.push(newTag);
    // TODO: Implement real API call when backend is ready
    // return this.http.post("/api/todoTag/",tag);
    return of(this.tagList);
  }

  deleteTag(tag: TagItem) {
    let filteredTag = this.tagList.filter(t => t.id !== +tag.id);
    this.tagList = [...filteredTag];
    // TODO: Implement real API call when backend is ready
    // this.http.delete("/api/todoTag/" + tag.id).subscribe(e => { });
    return of(this.tagList);
  }

  deleteTodo(todo: TodoItem) {
    let filteredTodo = this.todoList.filter(t => t.id !== +todo.id);
    this.todoList = [...filteredTodo];
    // TODO: Implement real API call when backend is ready
    // return this.http.delete("/api/todoList/" + todo.id);
    return of(this.todoList);
  }

  updateTodo(todo: TodoItem) {

    let updatedTodo;
    todo.selected = false;

    if (!todo.id) {
      todo.id = Math.floor(Math.random() * 9000) + 1000;
      this.todoList.push(todo);
      // updatedTodo = todo;
      // TODO: Implement real API call when backend is ready
      // updatedTodo = this.http.post("/api/todoList/", todo);
    }
    else {
      this.todoList = this.todoList.map(t => {
        if(t.id === +todo.id) {
          return {...todo}
        }
        return t;
      });
      // TODO: Implement real API call when backend is ready
      // updatedTodo = this.http.put("/api/todoList/" + todo.id, todo);
    }

    return of(todo);
  }
}
