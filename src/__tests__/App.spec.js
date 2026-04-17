import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'

function createJsonResponse(payload, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  }
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows light IP when displayName is empty and displays groups', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url.endsWith('/all')) {
        return Promise.resolve(
          createJsonResponse([
            {
              serialNumber: 'light-1',
              ip: '192.168.1.10',
              displayName: '',
            },
          ]),
        )
      }

      return Promise.resolve(
        createJsonResponse({
          groups: [{ groupName: 'bedroom', deviceCount: 2, serialNumbers: ['light-1'] }],
          totalGroups: 1,
        }),
      )
    })

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.text()).toContain('192.168.1.10')
    expect(wrapper.text()).toContain('bedroom (2)')
  })

  it('sends the expected PUT payload for a selected group', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
      if (!options && url.endsWith('/all')) {
        return Promise.resolve(
          createJsonResponse([
            {
              serialNumber: 'light-1',
              ip: '192.168.1.10',
              displayName: 'Key Light',
            },
          ]),
        )
      }

      if (!options && url.endsWith('/group')) {
        return Promise.resolve(
          createJsonResponse({
            groups: [{ groupName: 'bedroom', deviceCount: 2, serialNumbers: ['light-1'] }],
            totalGroups: 1,
          }),
        )
      }

      return Promise.resolve(createJsonResponse({}, true))
    })

    const wrapper = mount(App)
    await flushPromises()

    await wrapper.get('[data-testid="switch-groups"]').trigger('click')
    await wrapper.get('[data-testid="group-item"]').trigger('click')
    await wrapper.get('[data-testid="temperature-input"]').setValue('300')
    await wrapper.get('[data-testid="brightness-input"]').setValue('50')
    await wrapper.get('[data-testid="submit-update"]').trigger('click')

    const putCall = fetchMock.mock.calls.find((call) => call[0] === 'http://esp32-elgato-lights.local/lights' && call[1]?.method === 'PUT')
    expect(putCall).toBeTruthy()

    const [, requestOptions] = putCall
    expect(JSON.parse(requestOptions.body)).toEqual({
      group: 'bedroom',
      light: {
        brightness: 50,
        temperature: 300,
      },
    })
  })

  it('sends the expected PUT payload for a selected light', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
      if (!options && url.endsWith('/all')) {
        return Promise.resolve(
          createJsonResponse([
            {
              serialNumber: 'light-1',
              ip: '192.168.1.10',
              displayName: 'Desk Light',
            },
          ]),
        )
      }

      if (!options && url.endsWith('/group')) {
        return Promise.resolve(createJsonResponse({ groups: [], totalGroups: 0 }))
      }

      return Promise.resolve(createJsonResponse({}, true))
    })

    const wrapper = mount(App)
    await flushPromises()

    await wrapper.get('[data-testid="light-item"]').trigger('click')
    await wrapper.get('[data-testid="temperature-input"]').setValue('250')
    await wrapper.get('[data-testid="brightness-input"]').setValue('40')
    await wrapper.get('[data-testid="submit-update"]').trigger('click')

    const putCall = fetchMock.mock.calls.find((call) => call[0] === 'http://esp32-elgato-lights.local/lights' && call[1]?.method === 'PUT')
    expect(putCall).toBeTruthy()

    const [, requestOptions] = putCall
    expect(JSON.parse(requestOptions.body)).toEqual({
      serialNumber: 'light-1',
      light: {
        brightness: 40,
        temperature: 250,
      },
    })
  })
})
