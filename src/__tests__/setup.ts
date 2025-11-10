// Mock koffi for tests
jest.mock('koffi', () => ({
  default: {
    load: jest.fn(() => ({
      func: jest.fn(() => jest.fn()),
    })),
    struct: jest.fn(() => ({})),
  },
  load: jest.fn(() => ({
    func: jest.fn(() => jest.fn()),
  })),
  struct: jest.fn(() => ({})),
}));
