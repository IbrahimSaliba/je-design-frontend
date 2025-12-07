import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class UILibIconService {

  iconList = [
    { 'name': 'eg_monitor', 'fileName': 'monitor.svg' },
    { 'name': 'eg_money', 'fileName': 'money.svg' },
    { 'name': 'eg_home_security', 'fileName': 'home_security.svg' },
    { 'name': 'eg_paper_plane', 'fileName': 'paper_plane.svg' },
    { 'name': 'eg_menu', 'fileName': 'menu.svg' },
    { 'name': 'eg_home', 'fileName': 'home.svg' },
    { 'name': 'eg_documents', 'fileName': 'documents.svg' },
    { 'name': 'eg_edit', 'fileName': 'edit.svg' },
    { 'name': 'eg_boss', 'fileName': 'boss.svg' },
    { 'name': 'eg_partnership', 'fileName': 'partnership.svg' },
    { 'name': 'eg_partnership_1', 'fileName': 'partnership_1.svg' },
    { 'name': 'eg_success', 'fileName': 'success.svg' },
    { 'name': 'eg_rocket_launch', 'fileName': 'rocket_launch.svg' },
    { 'name': 'eg_rocket', 'fileName': 'rocket.svg' },
    { 'name': 'eg_business_and_trade', 'fileName': 'business_and_trade.svg' },
    { 'name': 'eg_enterprise', 'fileName': 'enterprise.svg' },
    { 'name': 'eg_cloud_computing', 'fileName': 'cloud_computing.svg' },
    { 'name': 'eg_cloud_computing_1', 'fileName': 'cloud_computing_1.svg' },
    { 'name': 'eg_cloud_computing_2', 'fileName': 'cloud_computing_2.svg' },
    { 'name': 'eg_send', 'fileName': 'send.svg' },
    { 'name': 'eg_table', 'fileName': 'table.svg' },
    { 'name': 'eg_notification', 'fileName': 'notification.svg' },
    { 'name': 'eg_person', 'fileName': 'person.svg' },
    { 'name': 'eg_menu_1', 'fileName': 'menu_1.svg' },
    { 'name': 'eg_delete', 'fileName': 'delete.svg' },
    { 'name': 'eg_close', 'fileName': 'close.svg' },
    { 'name': 'eg_magnifying_glass', 'fileName': 'magnifying_glass.svg' },
    { 'name': 'eg_settings', 'fileName': 'settings.svg' },
    { 'name': 'eg_twitter', 'fileName': 'twitter.svg' },
    { 'name': 'eg_facebook', 'fileName': 'facebook.svg' },
    { 'name': 'eg_linkedin', 'fileName': 'linkedin.svg' },
    { 'name': 'eg_pie_chart', 'fileName': 'pie_chart.svg' },
    { 'name': 'eg_paint_palette', 'fileName': 'paint_palette.svg' },
    { 'name': 'eg_server', 'fileName': 'server.svg' },
    { 'name': 'eg_database', 'fileName': 'database.svg' },
    { 'name': 'eg_database_1', 'fileName': 'database_1.svg' },
    { 'name': 'eg_creativity', 'fileName': 'creativity.svg' },
    { 'name': 'eg_list_text', 'fileName': 'list_text.svg' },
    { 'name': 'eg_list', 'fileName': 'list.svg' },
    { 'name': 'eg_shopping_list', 'fileName': 'shopping_list.svg' },
    { 'name': 'eg_checklist', 'fileName': 'checklist.svg' },
    { 'name': 'eg_bullet_list', 'fileName': 'bullet_list.svg' },
    { 'name': 'eg_shopping_cart', 'fileName': 'shopping_cart.svg' },
    { 'name': 'eg_add', 'fileName': 'add.svg' },
    { 'name': 'eg_shopping_cart_1', 'fileName': 'shopping_cart_1.svg' },
    { 'name': 'eg_shopping_basket', 'fileName': 'shopping_basket.svg' },
    { 'name': 'eg_edit_table', 'fileName': 'edit_table.svg' },
    { 'name': 'eg_casino_chips', 'fileName': 'casino_chips.svg' },
    { 'name': 'eg_add_1', 'fileName': 'add_1.svg' },
    { 'name': 'eg_chat', 'fileName': 'chat.svg' },
    { 'name': 'eg_chat_box', 'fileName': 'chat_box.svg' },
    { 'name': 'eg_chat_1', 'fileName': 'chat_1.svg' },
    { 'name': 'eg_agreement', 'fileName': 'agreement.svg' },
    { 'name': 'eg_box', 'fileName': 'box.svg' },
    { 'name': 'eg_link_1', 'fileName': 'link_1.svg' },
    { 'name': 'eg_link', 'fileName': 'link.svg' },
    { 'name': 'eg_message', 'fileName': 'message.svg' },
    { 'name': 'eg_inbox', 'fileName': 'inbox.svg' },
    { 'name': 'eg_inbox_1', 'fileName': 'inbox_1.svg' },
    { 'name': 'eg_invoices', 'fileName': 'invoices.svg' },
    { 'name': 'eg_receipt', 'fileName': 'receipt.svg' },
    { 'name': 'eg_search', 'fileName': 'search.svg' },
    { 'name': 'eg_date', 'fileName': 'date.svg' },
    { 'name': 'eg_building', 'fileName': 'building.svg' },
    { 'name': 'eg_block', 'fileName': 'block.svg' },
    { 'name': 'eg_users', 'fileName': 'users.svg' },
    { 'name': 'eg_user', 'fileName': 'user.svg' },
    { 'name': 'eg_map', 'fileName': 'map.svg' },
    { 'name': 'eg_location', 'fileName': 'location.svg' },
    { 'name': 'eg_drag', 'fileName': 'drag.svg' },
    {
      'name': 'eg_business_card_of_a_man_with_contact_info',
      'fileName': 'business_card_of_a_man_with_contact_info.svg'
    },
    { 'name': 'eg_help', 'fileName': 'help.svg' },
    { 'name': 'eg_list_1', 'fileName': 'list_1.svg' },
    { 'name': 'eg_facebook', 'fileName': 'facebook.svg' },
    { 'name': 'eg_meta', 'fileName': 'meta.svg' },
    { 'name': 'eg_google', 'fileName': 'google.svg' },
    { 'name': 'eg_apple', 'fileName': 'apple.svg' }
  ]

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
  }

  init() {
    this.iconList.forEach(i => {
      this.matIconRegistry.addSvgIcon(
        i.name,
        this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/images/svg-icons/${i.fileName}`)
      );
    });
  }
}
