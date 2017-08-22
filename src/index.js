import withProps from 'with-props'
import { last, take, curry } from 'ramda'

const trade = (order, lastTransaction) => ({
  ...lastTransaction,
  price: order.price,
  volume: order.volume,
  cash: lastTransaction.cash - (order.volume * order.price),
  keep: lastTransaction.keep + order.volume,
  buyTimes: order.volume > 0 ? lastTransaction.buyTimes + 1 : lastTransaction.buyTimes,
  sellTimes: order.volume < 0 ? lastTransaction.sellTimes + 1 : lastTransaction.sellTimes,
})

/**
 * @param {Function} strategy - the strategy to use, see ./strategies.js
 * @param {Array} transformers - data transformers, used to supply required data for strategy, see ../clean/transformers.js
 *
 * @returns {undefined}
 */
const createBacktest = (strategy, props) => (rawData, cash = 100000) => {
  const data = withProps(props, rawData)
  // buyTimes: 买入交易次数
  // sellTime: 卖出交易次数
  const transactions = [{ origin: cash, cash, keep: 0, buyTimes: 0, sellTimes: 0 }]

  data.forEach((d, i) => {
    let transaction = {
      ...last(transactions),
      date: d.date,
    }
    const order = strategy(take(i + 1, data), transaction.cash, transaction.keep)

    if (order.volume !== 0) {
      transaction = trade(order, transaction)
    }

    transaction.total = transaction.cash + (transaction.price * transaction.keep)
    transactions.push(transaction)
  })
  return transactions
}

export default createBacktest
