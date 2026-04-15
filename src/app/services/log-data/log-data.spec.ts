import { TestBed } from '@angular/core/testing'
import { vi } from 'vitest'
import { LogData } from './log-data'
import { firstValueFrom } from 'rxjs'
import * as firestoreFns from 'firebase/firestore'

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: vi.fn(() => 'mock-timestamp')
  },
  addDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  getFirestore: vi.fn(() => ({})),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn()
}))

describe('LogData', () => {
  let service: LogData

  beforeEach(async () => {
    vi.clearAllMocks()
    await TestBed.configureTestingModule({
      providers: [LogData]
    }).compileComponents()

    service = TestBed.inject(LogData)
  })

  it('should create', () => {
    expect(service).toBeTruthy()
  })

  it('should save period entries in user-scoped path', async () => {
    const collectionRef = {} as any
    vi.mocked(firestoreFns.collection).mockReturnValue(collectionRef)
    vi.mocked(firestoreFns.addDoc).mockResolvedValue({} as any)
    const entry = {
      start: '2026-01-01',
      end: '2026-01-04',
      intensity: 'Normal',
      symptoms: ['Cramps']
    }

    await service.savePeriodEntry('uid-123', entry)

    expect(firestoreFns.collection).toHaveBeenCalledWith(expect.anything(), 'users/uid-123/period-logs')
    expect(firestoreFns.addDoc).toHaveBeenCalledWith(collectionRef, {
      ...entry,
      timestamp: 'mock-timestamp'
    })
  })

  it('should query user-scoped logs ordered by timestamp', async () => {
    const collectionRef = {} as any
    const queryRef = {} as any
    const orderByRef = {} as any
    vi.mocked(firestoreFns.collection).mockReturnValue(collectionRef)
    vi.mocked(firestoreFns.orderBy).mockReturnValue(orderByRef as any)
    vi.mocked(firestoreFns.query).mockReturnValue(queryRef as any)
    vi.mocked(firestoreFns.onSnapshot).mockImplementation((_ref: any, onNext: any) => {
      onNext({
        docs: [
          {
            id: '1',
            data: () => ({
              start: '2026-01-01',
              end: '2026-01-04',
              intensity: 'Normal',
              symptoms: []
            })
          }
        ]
      } as any)

      return () => {}
    })

    const logs = await firstValueFrom(service.getLogs('uid-123'))

    expect(firestoreFns.collection).toHaveBeenCalledWith(expect.anything(), 'users/uid-123/period-logs')
    expect(firestoreFns.orderBy).toHaveBeenCalledWith('timestamp', 'desc')
    expect(firestoreFns.query).toHaveBeenCalledWith(collectionRef, orderByRef)
    expect(firestoreFns.onSnapshot).toHaveBeenCalled()
    expect(logs).toHaveLength(1)
  })

  it('should fetch limited recent logs for personalization', async () => {
    const collectionRef = {} as any
    const queryRef = {} as any
    const orderByRef = {} as any
    const limitRef = {} as any
    vi.mocked(firestoreFns.collection).mockReturnValue(collectionRef)
    vi.mocked(firestoreFns.orderBy).mockReturnValue(orderByRef as any)
    vi.mocked(firestoreFns.limit).mockReturnValue(limitRef as any)
    vi.mocked(firestoreFns.query).mockReturnValue(queryRef as any)
    vi.mocked(firestoreFns.getDocs).mockResolvedValue({
      docs: [
        {
          id: 'doc-1',
          data: () => ({
            start: '2026-01-01',
            end: '2026-01-04',
            intensity: 'Normal',
            symptoms: ['Cramps']
          })
        }
      ]
    } as any)

    const logs = await service.getRecentLogs('uid-123', 5)

    expect(firestoreFns.getDocs).toHaveBeenCalledWith(queryRef)
    expect(logs[0].id).toBe('doc-1')
  })
})
