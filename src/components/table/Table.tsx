import React, {useEffect, useMemo, useRef, useState} from "react";

export interface Footer<T, K> {
  title?: string,
  aggFunc: (data: (T & K)[]) => number,
  position: number
}

export interface Column<T, K> {
  accessor: keyof T | { value: ((item: T) => string | number), field: keyof (T&K) },
  header: string,
}

export interface TableOption<T, K> {
  selectionApi: [Record<string | number, boolean>, React.Dispatch<React.SetStateAction<Record<string, boolean>>>]
  selected: boolean;
  initialSort: keyof T | keyof K;
  columns: Column<T, K>[];
  accessorId: keyof (T & K);
  footer: Footer<T, K>[],
  data: {[key in keyof T]: number | string}[]
}

type AccType<T> = T[keyof T]

export const Table = <T, K = void>({selected, selectionApi, columns, data, accessorId, initialSort, footer}: TableOption<T, K>) => {

  const [selectedItems, setSelectedItems] = selectionApi
  const [filterMode, setFilterMode] = useState<keyof (T & K)>(typeof columns[0].accessor === "object" ? columns[0].accessor.field : columns[0].accessor as keyof T)
  const headerInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const obj = prepareData.reduce((acc, item) => {
      acc[item[accessorId]] = false
      return acc
    }, {} as Record<AccType<typeof data[0]>, boolean>)
    setSelectedItems(obj)
  }, [data])

  const prepareData = useMemo(() => {
    const pureData  = [...data] as {[key in keyof (T & K)]: number | string}[]
    columns.forEach((item) => {
      if (typeof item.accessor === "object") {
        pureData.forEach(elem => {
          if (typeof item.accessor === "object") {
            const accessor = item.accessor
            elem[accessor.field] = accessor.value(elem as T)
          }
        })
      }
    })
    pureData.sort((a, b) => a[initialSort] > b[initialSort] ? 1 : -1)
    return pureData
  }, [data])

  const filteredData = useMemo(() => {
    return prepareData.filter(item => {
      return (item[filterMode] + '').toLowerCase().includes(search)
    })
  }, [search, filterMode, prepareData])

  const prepareFooter = useMemo(() => footer.reduce((acc, item) => {
    acc[item.position] = (item?.title || '')  + item.aggFunc(filteredData as (T & K) [])
    return acc
  }, {} as {[key: number]: string | number}),[filteredData])

  useEffect(() => {
    if (!headerInputRef.current) return
    const filterLength = Object.values<boolean>(selectedItems).filter(Boolean).length
    if (filterLength > 0 && filterLength < filteredData.length) {
      headerInputRef.current.indeterminate = true
    } else if (filterLength === filteredData.length && filteredData.length !== 0) {
      headerInputRef.current.indeterminate = false
      headerInputRef.current.checked = true
    } else {
      headerInputRef.current.indeterminate = false
      headerInputRef.current.checked = false
    }
  },[selectedItems, filteredData])

  useEffect(() => {
    const data = {...selectedItems}
    const keys = filteredData.map(item => item[accessorId] as string)
    Object.keys(selectedItems).forEach((key) => {
      if (!data[key]) return;
      data[key] = keys.includes(key);
    })
    setSelectedItems(data)
  }, [filteredData])

  return (
    <div>
      <div>
        <div className='search-wrapper'>
          <div className='search__title'>Поиск</div>
          <input value={search} onChange={(e) => setSearch(e.target.value)}/>
          <select value={filterMode as string} onChange={(e) => setFilterMode(e.target.value as keyof (T&K))}>
            {columns.map((item) => <option value={typeof item.accessor === "object" ? item.accessor.field as string : item.accessor as string}>{item.header}</option>)}
          </select>
        </div>
        {!!filteredData.length ? <table>
            <thead>
            {selected && <th><input onChange={(e) => {
              const checked = e.target.checked
              setSelectedItems(prepareData.reduce((acc, item) => {
                acc[item[accessorId]] = checked
                return acc
              }, {} as Record<AccType<typeof data[0]>, boolean>))
            }
            } ref={headerInputRef} type={'checkbox'}/></th>}
            {columns.map((item) => (
              <th key={item.header}>{item.header}</th>
            ))}
            </thead>
            <tbody>
            {filteredData.map((item) =>
              <tr key={item[accessorId]}>
                {selected && <td><input checked={selectedItems[item[accessorId]]} onChange={(e) => setSelectedItems({
                  ...selectedItems,
                  [item[accessorId]]: e.target.checked
                })} type={'checkbox'}/></td>}
                {columns.map(({accessor}) =>
                  <td>{item[typeof accessor === 'object' ? accessor.field : accessor]}</td>
                )}
              </tr>
            )}
            </tbody>
            <tfoot>
            {columns.map((item, index) => {
              return <td>{prepareFooter[index] && <span>{prepareFooter[index]}</span>}</td>
            })}
            </tfoot>
          </table>
          : <div>Нет совпадений</div>
        }
      </div>
    </div>
  );
}