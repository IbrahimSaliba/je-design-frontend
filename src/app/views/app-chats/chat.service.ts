import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Chat, ChatCollection, User } from 'app/shared/models/chat.model';


// tslint:disable-next-line: max-classes-per-file
@Injectable()
export class ChatService {
  public contacts: User[] = [];
  public chats: ChatCollection[] = [];
  public user: User;
  public collectionLoading: boolean;

  onContactSelected = new BehaviorSubject<any>(null);
  onUserUpdated = new Subject<User>();

  onChatSelected = new BehaviorSubject<any>(null);
  onChatsUpdated = new Subject<any>();

  constructor(private http: HttpClient) {
    // Mock data removed - implement real API calls when backend is ready
    // TODO: Implement chat backend endpoints
  }

  loadChatData(): Observable<any> {
    return combineLatest(this.getAllContacts(), this.getAllChats(), this.getCurrentUser(), (contacts, chats, user) => {
      this.contacts = contacts;
      this.chats = chats;
      this.user = user;
      // console.log('next.willCall', user)
      this.onUserUpdated.next(user);
      // console.log('next.called')
      // console.log(
      //   "contacts:",
      //   contacts,
      //   "\n chats:",
      //   chats,
      //   "\n currUser:",
      //   user
      // );
    });
  }
  public getChatByContact(contactId): Observable<ChatCollection> {
    const chatInfo = this.user.chatInfo.find((chat) => chat.contactId === contactId);
    this.collectionLoading = true;

    if (!chatInfo) {
      return this.createChatCollection(contactId)
      .pipe(switchMap((chatColl) => {
        return this.getChatByContact(contactId);
      }));
    }

    return this.getAllChats().pipe(
      switchMap((chats) => {
        const chatCollection = chats.find((chat) => chat.id === chatInfo.chatId);
        const contact = this.contacts.find(
          // tslint:disable-next-line: no-shadowed-variable
          (contact) => contact.id === contactId
        );
        // console.log(chatCollection)
        this.onChatSelected.next({
          chatCollection,
          contact,
        });
        this.collectionLoading = false;
        return of(chatCollection);
      })
    );
  }

  createChatCollection(contactId) {
    // tslint:disable-next-line: no-shadowed-variable
    const contact = this.contacts.find((contact) => contact.id === contactId);
    const chatId = (Math.random() * 1000000000).toString();

    const chatCollection: ChatCollection = {
      id: chatId,
      chats: [],
    };

    const chatInfo = {
      chatId,
      lastChatTime: new Date(),
      contactId: contact.id,
      contactName: contact.name,
      unread: null,
    };

    // TODO: Implement real API call when backend is ready
    // return this.http.post('api/chat-collections', { ...chatCollection })
    this.chats.push(chatCollection);
    return of(this.chats)
    .pipe(switchMap((updatedChatCollection) => {
      this.user.chatInfo.push(chatInfo);
      return this.updateUser(this.user).pipe(
        switchMap((res) => {
          return this.getCurrentUser().pipe(
            map((user) => {
              this.user = user;
              this.onUserUpdated.next(user);
            })
          );
        })
      );
    }));
  }

  getAllContacts(): Observable<User[]> {
    // TODO: Implement real API call when backend is ready
    // return this.http.get<User[]>('api/contacts');
    return of(this.contacts);
  }
  getAllChats(): Observable<ChatCollection[]> {
    // TODO: Implement real API call when backend is ready
    // return this.http.get<ChatCollection[]>('api/chat-collections');
    return of(this.chats);
  }
  getCurrentUser(): Observable<User> {
    // TODO: Implement real API call when backend is ready
    // return this.http.get<User>('api/chat-user').pipe(map((res) => res[0]));
    return of(this.user);
  }
  updateUser(user: User): Observable<User> {
    // TODO: Implement real API call when backend is ready
    // return this.http.put<User>(`api/chat-user/${user.id}`, { ...user });
    this.user = user;
    return of(this.user);
  }
  updateChats(chatId: string, chats: Chat[]): Observable<ChatCollection> {
    const chatCollection: ChatCollection = {
      id: chatId,
      chats,
    };
    
    // Update local chats array
    this.chats = this.chats.map((coll) => {
      if(coll.id == chatId) {
        coll.chats = [...chats]
      }
      return coll;
    });

    // TODO: Implement real API call when backend is ready
    // return this.http.put<ChatCollection>('api/chat-collections', chatCollection);
    return of(this.chats.find(coll => coll.id == chatId));
  }

  autoReply(chat) {
    setTimeout(() => {
      this.onChatsUpdated.next(chat);
    }, 1500);
  }
}
