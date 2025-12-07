import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { ChatService } from "../chat.service";
import { Subscription } from "rxjs";
import { User } from "app/shared/models/chat.model";

@Component({
    selector: "app-chat-left-sidenav",
    templateUrl: "./chat-left-sidenav.component.html",
    styleUrls: ["./chat-left-sidenav.component.scss"],
    standalone: false
})
export class ChatLeftSidenavComponent implements OnInit {
  userUpdateSub: Subscription;
  loadDataSub: Subscription;
  
  isSidenavOpen = true;

  currentUser: User = new User();
  contacts: any[];

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // this.chatService.onChatsUpdated
    //   .subscribe(updatedChats => {
    //     this.chats = updatedChats;
    //   });

    this.userUpdateSub = this.chatService.onUserUpdated
      .subscribe(updatedUser => {
        this.currentUser = updatedUser;
      });

    this.loadDataSub = this.chatService.loadChatData()
      .subscribe(res => {
        this.currentUser = this.chatService.user;
        // this.chats = this.chatService.chats;
        this.contacts = this.chatService.contacts;
        // this.chatService.onUserUpdated.next(this.chatService.user)
        this.cdr.markForCheck();
      });
  }
  ngOnDestroy() {
    if( this.userUpdateSub ) this.userUpdateSub.unsubscribe();
    if( this.loadDataSub ) this.loadDataSub.unsubscribe();
  }

  getChatByContact(contactId) { 
    this.chatService.getChatByContact(contactId)
      .subscribe(res => {
        // console.log('from sub',res);
      }, err => {
        console.log(err)
      })
  }
  
}
