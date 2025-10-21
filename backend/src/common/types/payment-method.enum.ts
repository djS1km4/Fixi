export enum PaymentMethod {
  // Tarjetas
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',

  // Métodos digitales colombianos
  NEQUI = 'NEQUI',
  DAVIPLATA = 'DAVIPLATA',

  // Transferencias bancarias
  PSE = 'PSE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ACH_TRANSFER = 'ACH_TRANSFER',

  // Efectivo
  CASH = 'CASH',
  BALOTO = 'BALOTO',
  EFECTY = 'EFECTY',

  // Créditos de consumo a corto plazo
  SHORT_TERM_CREDIT = 'SHORT_TERM_CREDIT',
  INSTALMENT_CREDIT = 'INSTALMENT_CREDIT',

  // Wallets digitales
  DIGITAL_WALLET = 'DIGITAL_WALLET',

  // Otros métodos
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
}