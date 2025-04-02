import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { IconComponent } from '../icon/icon.component';

interface Icon {
  name: string;
  url: string
}

@Component({
  selector: 'pgz-icons-picker',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './icons-picker.component.html',
  styleUrl: './icons-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconsPickerComponent {
  @Input() 
  public isDropdownOpen: boolean = false;
  @Output() 
  iconSelected: EventEmitter<string> = new EventEmitter<string>();
  public selectedIcon: string | null = null;
  public CUSTOM_ICONS: Icon[] = [
    { name: 'icon_group', url: 'assets/icons/picker/group.svg'},
    { name: 'icon_activity', url: 'assets/icons/picker/activity.svg'},
    { name: 'icon_waist', url: 'assets/icons/picker/waist.svg'},
    { name: 'icon_bag', url: 'assets/icons/picker/bag.svg'},
    { name: 'icon_handbag', url: 'assets/icons/picker/handbag.svg'},
    { name: 'icon_purse', url: 'assets/icons/picker/purse.svg'},
    { name: 'icon_shop', url: 'assets/icons/picker/shop.svg'},
    { name: 'icon_market', url: 'assets/icons/picker/market.svg'},
    { name: 'icon_hanger', url: 'assets/icons/picker/hanger.svg'},
    { name: 'icon_t-shirt', url: 'assets/icons/picker/t-shirt.svg'},
    { name: 'icon_football', url: 'assets/icons/picker/football.svg'},
    { name: 'icon_ball', url: 'assets/icons/picker/ball.svg'},
    { name: 'icon_barbell', url: 'assets/icons/picker/barbell.svg'},
    { name: 'icon_dumbbells', url: 'assets/icons/picker/dumbbells.svg'},
    { name: 'icon_meditation', url: 'assets/icons/picker/meditation.svg'},
    { name: 'icon_bone', url: 'assets/icons/picker/bone.svg'},
    { name: 'icon_trace', url: 'assets/icons/picker/trace.svg'},
    { name: 'icon_bus', url: 'assets/icons/picker/bus.svg'},
    { name: 'icon_building', url: 'assets/icons/picker/building.svg'},
    { name: 'icon_house', url: 'assets/icons/picker/house.svg'},
    { name: 'icon_call-chat', url: 'assets/icons/picker/call-chat.svg'},
    { name: 'icon_case', url: 'assets/icons/picker/case.svg'},
    { name: 'icon_clapperboard', url: 'assets/icons/picker/clapperboard.svg'},
    { name: 'icon_gamepad', url: 'assets/icons/picker/gamepad.svg'},
    { name: 'icon_masks', url: 'assets/icons/picker/masks.svg'},
    { name: 'icon_cosmetic', url: 'assets/icons/picker/cosmetic.svg'},
    { name: 'icon_cup-hot', url: 'assets/icons/picker/cup-hot.svg'},
    { name: 'icon_donut', url: 'assets/icons/picker/donut.svg'},
    { name: 'icon_tea-cup-hot', url: 'assets/icons/picker/tea-cup-hot.svg'},
    { name: 'icon_wineglass', url: 'assets/icons/picker/wineglass.svg'},
    { name: 'icon_garage', url: 'assets/icons/picker/garage.svg'},
    { name: 'icon_gas-station', url: 'assets/icons/picker/gas-station.svg'},
    { name: 'icon_hand-heart', url: 'assets/icons/picker/hand-heart.svg'},
    { name: 'icon_heart-angle', url: 'assets/icons/picker/heart-angle.svg'},
    { name: 'icon_hospital', url: 'assets/icons/picker/hospital.svg'},
    { name: 'icon_jar-of-pills', url: 'assets/icons/picker/jar-of-pills.svg'},
    { name: 'icon_paint-roller', url: 'assets/icons/picker/paint-roller.svg'},
    { name: 'icon_pills', url: 'assets/icons/picker/pills.svg'},
    { name: 'icon_square-academic-cap', url: 'assets/icons/picker/square-academic-cap.svg'},
    { name: 'icon_hugeicons_airplane', url: 'assets/icons/picker/hugeicons_airplane.svg'},
    { name: 'icon_hugeicons_apple', url: 'assets/icons/picker/hugeicons_apple.svg'},
    { name: 'icon_hugeicons_apple-pie', url: 'assets/icons/picker/hugeicons_apple-pie.svg'},
    { name: 'icon_hugeicons_archive', url: 'assets/icons/picker/hugeicons_archive.svg'},
    { name: 'icon_hugeicons_auction', url: 'assets/icons/picker/hugeicons_auction.svg'},
    { name: 'icon_hugeicons_baby', url: 'assets/icons/picker/hugeicons_baby.svg'},
    { name: 'icon_hugeicons_baby2', url: 'assets/icons/picker/hugeicons_baby2.svg'},
    { name: 'icon_hugeicons_baby-bottle', url: 'assets/icons/picker/hugeicons_baby-bottle.svg'},
    { name: 'icon_hugeicons_baby-boy-dress', url: 'assets/icons/picker/hugeicons_baby-boy-dress.svg'},
    { name: 'icon_hugeicons_baseball-bat', url: 'assets/icons/picker/hugeicons_baseball-bat.svg'},
    { name: 'icon_hugeicons_basketball', url: 'assets/icons/picker/hugeicons_basketball.svg'},
    { name: 'icon_hugeicons_beach2', url: 'assets/icons/picker/hugeicons_beach2.svg'},
    { name: 'icon_hugeicons_beach', url: 'assets/icons/picker/hugeicons_beach.svg'},
    { name: 'icon_hugeicons_bicycle', url: 'assets/icons/picker/hugeicons_bicycle.svg'},
    { name: 'icon_hugeicons_birthday-cake', url: 'assets/icons/picker/hugeicons_birthday-cake.svg'},
    { name: 'icon_hugeicons_boat', url: 'assets/icons/picker/hugeicons_boat.svg'},
    { name: 'icon_hugeicons_body-part-muscle', url: 'assets/icons/picker/hugeicons_body-part-muscle.svg'},
    { name: 'icon_hugeicons_body-soap', url: 'assets/icons/picker/hugeicons_body-soap.svg'},
    { name: 'icon_hugeicons_bone', url: 'assets/icons/picker/hugeicons_bone.svg'},
    { name: 'icon_hugeicons_book2', url: 'assets/icons/picker/hugeicons_book2.svg'},
    { name: 'icon_hugeicons_boxing-glove', url: 'assets/icons/picker/hugeicons_boxing-glove.svg'},
    { name: 'icon_hugeicons_briefcase6', url: 'assets/icons/picker/hugeicons_briefcase6.svg'},
    { name: 'icon_hugeicons_briefcase-dollar', url: 'assets/icons/picker/hugeicons_briefcase-dollar.svg'},
    { name: 'icon_hugeicons_building5', url: 'assets/icons/picker/hugeicons_building5.svg'},
    { name: 'icon_hugeicons_bulb', url: 'assets/icons/picker/hugeicons_bulb.svg'},
    { name: 'icon_hugeicons_bus3', url: 'assets/icons/picker/hugeicons_boxing-glove.svg'},
    { name: 'icon_hugeicons_call2', url: 'assets/icons/picker/hugeicons_call2.svg'},
    { name: 'icon_hugeicons_call', url: 'assets/icons/picker/hugeicons_call.svg'},
    { name: 'icon_hugeicons_camera', url: 'assets/icons/picker/hugeicons_camera.svg'},
    { name: 'icon_hugeicons_car', url: 'assets/icons/picker/hugeicons_car.svg'},
    { name: 'icon_hugeicons_car3', url: 'assets/icons/picker/hugeicons_car3.svg'},
    { name: 'icon_hugeicons_car-parking2', url: 'assets/icons/picker/hugeicons_car-parking2.svg'},
    { name: 'icon_hugeicons_cellular-network', url: 'assets/icons/picker/hugeicons_cellular-network.svg'},
    { name: 'icon_hugeicons_certificate', url: 'assets/icons/picker/hugeicons_certificate.svg'},
    { name: 'icon_hugeicons_champion', url: 'assets/icons/picker/hugeicons_champion.svg'},
    { name: 'icon_hugeicons_chicken-thighs', url: 'assets/icons/picker/hugeicons_chicken-thighs.svg'},
    { name: 'icon_hugeicons_coffee2', url: 'assets/icons/picker/hugeicons_coffee2.svg'},
    { name: 'icon_hugeicons_cupcake2', url: 'assets/icons/picker/hugeicons_cupcake2.svg'},
    { name: 'icon_hugeicons_dental-tooth', url: 'assets/icons/picker/hugeicons_dental-tooth.svg'},
    { name: 'icon_hugeicons_discord', url: 'assets/icons/picker/hugeicons_discord.svg'},
    { name: 'icon_hugeicons_discount-tag', url: 'assets/icons/picker/hugeicons_discount-tag.svg'},
    { name: 'icon_hugeicons_doctor3', url: 'assets/icons/picker/hugeicons_doctor3.svg'},
    { name: 'icon_hugeicons_document-validation', url: 'assets/icons/picker/hugeicons_document-validation.svg'},
    { name: 'icon_hugeicons_dress3', url: 'assets/icons/picker/hugeicons_dress3.svg'},
    { name: 'icon_hugeicons_drink', url: 'assets/icons/picker/hugeicons_drink.svg'},
    { name: 'icon_hugeicons_dumbbell2', url: 'assets/icons/picker/hugeicons_dumbbell2.svg'},
    { name: 'icon_hugeicons_ev-charging', url: 'assets/icons/picker/hugeicons_ev-charging.svg'},
    { name: 'icon_hugeicons_flower-pot', url: 'assets/icons/picker/hugeicons_flower-pot.svg'},
    { name: 'icon_hugeicons_game-controller', url: 'assets/icons/picker/hugeicons_game-controller.svg'},
    { name: 'icon_hugeicons_gift', url: 'assets/icons/picker/hugeicons_gift.svg'},
    { name: 'icon_hugeicons_hair-dryer', url: 'assets/icons/picker/hugeicons_hair-dryer.svg'},
    { name: 'icon_hugeicons_hamburger2', url: 'assets/icons/picker/hugeicons_hamburger2.svg'},
    { name: 'icon_hugeicons_hanger', url: 'assets/icons/picker/hugeicons_hanger.svg'},
    { name: 'icon_hugeicons_hold3', url: 'assets/icons/picker/hugeicons_hold3.svg'},
    { name: 'icon_hugeicons_home9', url: 'assets/icons/picker/hugeicons_home9.svg'},
    { name: 'icon_hugeicons_house3', url: 'assets/icons/picker/hugeicons_house3.svg'},
    { name: 'icon_hugeicons_house4', url: 'assets/icons/picker/hugeicons_house4.svg'},
    { name: 'icon_hugeicons_key1', url: 'assets/icons/picker/hugeicons_key1.svg'},
    { name: 'icon_hugeicons_manager', url: 'assets/icons/picker/hugeicons_manager.svg'},
    { name: 'icon_hugeicons_medicine2', url: 'assets/icons/picker/hugeicons_medicine2.svg'},
    { name: 'icon_hugeicons_mortarboard2', url: 'assets/icons/picker/hugeicons_mortarboard2.svg'},
    { name: 'icon_hugeicons_motorbike2', url: 'assets/icons/picker/hugeicons_motorbike2.svg'},
    { name: 'icon_hugeicons_necklace', url: 'assets/icons/picker/hugeicons_necklace.svg'},
    { name: 'icon_hugeicons_noodles', url: 'assets/icons/picker/hugeicons_noodles.svg'},
    { name: 'icon_hugeicons_note', url: 'assets/icons/picker/hugeicons_note.svg'},
    { name: 'icon_hugeicons_paint-brush4', url: 'assets/icons/picker/hugeicons_paint-brush4.svg'},
    { name: 'icon_hugeicons_perfume', url: 'assets/icons/picker/hugeicons_perfume.svg'},
    { name: 'icon_hugeicons_plug', url: 'assets/icons/picker/hugeicons_plug.svg'},
    { name: 'icon_hugeicons_router', url: 'assets/icons/picker/hugeicons_router.svg'},
    { name: 'icon_hugeicons_security-check', url: 'assets/icons/picker/hugeicons_security-check.svg'},
    { name: 'icon_hugeicons_shopping-cart', url: 'assets/icons/picker/hugeicons_shopping-cart.svg'},
    { name: 'icon_hugeicons_shorts-pants', url: 'assets/icons/picker/hugeicons_shorts-pants.svg'},
    { name: 'icon_hugeicons_signal-full2', url: 'assets/icons/picker/hugeicons_signal-full2.svg'},
    { name: 'icon_hugeicons_sketch', url: 'assets/icons/picker/hugeicons_sketch.svg'},
    { name: 'icon_hugeicons_speed-train2', url: 'assets/icons/picker/hugeicons_speed-train2.svg'},
    { name: 'icon_hugeicons_spoon-and-knife', url: 'assets/icons/picker/hugeicons_spoon-and-knife.svg'},
    { name: 'icon_hugeicons_stethoscope2', url: 'assets/icons/picker/hugeicons_stethoscope2.svg'},
    { name: 'icon_hugeicons_students', url: 'assets/icons/picker/hugeicons_students.svg'},
    { name: 'icon_hugeicons_swimming', url: 'assets/icons/picker/hugeicons_swimming.svg'},
    { name: 'icon_hugeicons_taxi', url: 'assets/icons/picker/hugeicons_taxi.svg'},
    { name: 'icon_hugeicons_tools', url: 'assets/icons/picker/hugeicons_tools.svg'},
    { name: 'icon_hugeicons_tulip', url: 'assets/icons/picker/hugeicons_tulip.svg'},
    { name: 'icon_hugeicons_water-pump', url: 'assets/icons/picker/hugeicons_water-pump.svg'},
    { name: 'icon_hugeicons_yoga2', url: 'assets/icons/picker/hugeicons_yoga2.svg'},
    { name: 'icon_hugeicons_yurt', url: 'assets/icons/picker/hugeicons_yurt.svg'},
    { name: 'icon_hugeicons_zakat', url: 'assets/icons/picker/hugeicons_zakat.svg'},
    { name: 'icon_hugeicons_music-note3', url: 'assets/icons/picker/hugeicons_music-note3.svg'},
    { name: 'icon_hugeicons_touch', url: 'assets/icons/picker/hugeicons_touch.svg'},
    { name: 'icon_hugeicons_user-group', url: 'assets/icons/picker/hugeicons_user-group.svg'},
    { name: 'icon_hugeicons_user-love', url: 'assets/icons/picker/hugeicons_user-love.svg'},
    { name: 'icon_park-outline_fingernai', url: 'assets/icons/picker/park-outline_fingernai.svg'},
  ];

  constructor(
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) {
    this.CUSTOM_ICONS.forEach(icon => {
      this.iconRegistry.addSvgIcon(icon.name, this.sanitizer.bypassSecurityTrustResourceUrl(icon.url));
    });
  }

  public selectIcon(icon: string) {
    this.selectedIcon = icon;
    this.iconSelected.emit(icon);
    this.isDropdownOpen = false; 
  }
}
