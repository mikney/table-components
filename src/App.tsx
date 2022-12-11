import React, {useEffect, useMemo, useRef, useState} from 'react';
import './App.scss';
import {mockData, mockData2} from "./mock";
import {Column, Footer, Table} from "./components/table/Table";

type Status = 'active' | 'archive'
export interface DataItem {
  id: string,
  status: Status,
  sum: number,
  qty: number,
  volume: number,
  name: string,
  delivery_date: string,
  currency: string
}

const footer: Footer<DataItem, {test: number}>[] = [
  {
    title: 'Общий обьем: ',
    aggFunc: (data) => data.reduce((acc, item) => acc + item.sum, 0),
    position: 5,
  },
  {
    title: 'Общее количество: ',
    aggFunc: data => data.reduce((acc, item) => acc + item.qty, 0),
    position: 4,
  }
]

const statusMap: {[key in Status]: string} = {
  active: 'Активен',
  archive: 'В арихиве'
}

const columns: Column<DataItem ,{test: number}>[] = [
  {
    header: 'Название',
    accessor: 'name',
  },
  {
    header: 'Статус',
    accessor: {value: (item) => statusMap[item.status], field: "status"},
  },
  {
    header: 'Сумма',
    accessor: {
      value: (item) =>  item.sum,
       field: 'sum'
    },
  },
  {
    header: 'Количество',
    accessor: 'qty',
  },
  {
    header: 'Объем',
    accessor: 'volume',
  },
  {
    header: 'Дата доставки',
    accessor: "delivery_date",
  },
  {
    header: 'Валюта',
    accessor: "currency"
  },
  {
    header: 'Всего',
    accessor: {
      value: (item) => item.sum * item.qty + ` ${item.currency}`,
      field: 'test'
    },
  }
]


export const App = () => {

  const [show, setShow] = useState(false)
  const [data, setData] = useState<DataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setIsLoading(true)
    const first = new Promise<DataItem[]>(resolve => {
      setTimeout(() => {
        resolve(mockData)
      }, 400)
    })
    const second = new Promise<DataItem[]>(resolve => {
      setTimeout(() => {
        resolve(mockData2)
      }, 500)
    })
    Promise.all([first, second])
      .then((result) => {
        const [data1, data2] = result
        setData([...data1, ...data2])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])


  const cancelGoods = async (items: DataItem[]) => {
    const ids = items.map(item => item.id)
    const resp = await new Promise(resolve => {
        resolve({})
    })
      .then(() => {
        setData(data.filter(item => {
          return !ids.includes(item.id)
        }))
        setShow(false)
      })
  }
  return (
    <div className="App">
      {isLoading ? 'Загрузка...' :
        <>
      <Table<DataItem, {test: number}>
        selectionApi={[selectedItems, setSelectedItems]}
        selected={true} initialSort={'delivery_date'} columns={columns} data={data} accessorId={'id'}
        footer={footer}
        />
        <div>
          <button disabled={!Object.values(selectedItems).some(item => item)} onClick={() => setShow(true)} className='btn btn-close'>Аннулировать</button>
        </div>
      {show && <div onClick={() => setShow(false)} className='modal__backdrop'>
        <div onClick={(e) => e.stopPropagation()} className='modal__wrapper'>
          <div className='modal__content'>
            <div className='article'>
              Вы уверены что хотите аннулировать товар(ы): {data.filter(item => selectedItems[item['id']]).map((item) => item.name).join(',')}
            </div>
            <div className='btn-wrapper'>
              <button onClick={() => setShow(false)} className='btn'>Отклонить</button>
              <button onClick={() => cancelGoods(data.filter(item => selectedItems[item['id']]))} className='btn'>Применить</button>
            </div>
          </div>
        </div>
      </div>
      }
      </>
      }
    </div>
  );
}

