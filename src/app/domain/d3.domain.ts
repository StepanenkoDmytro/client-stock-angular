export interface ID3Value {
  title: string,
  money: number | string,
}

export interface SimpleDataModel {
  name: string,
  value: number,
  color?: string
}

export const colorPalette = [
  '#D5DB24', '#B60D0D', '#C14619', '#88400C', '#A36A10', '#D3680B', '#F29500',
  '#C89D11', '#EECA00', '#E3E300', '#AAC800', '#7EA401', '#54A305', '#007924',
  '#54B189', '#408869', '#185A3E', '#67BAB6', '#2E9E99', '#00768B', '#39779D',
  '#005183', '#978FE0', '#645ABE', '#6140D9', '#422F87', '#976AA6', '#905EC5',
  '#9C47B9', '#AD16DF', '#8210A8', '#C460C6', '#B674A5', '#AC3EAE', '#CD00D1',
  '#8C4366', '#AB3F73', '#DF3185', '#BC025C', '#763E3F', '#56191A', '#480304'
];

