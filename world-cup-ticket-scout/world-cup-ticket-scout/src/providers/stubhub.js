export const stubhubProvider = {
  id: 'stubhub',
  label: 'StubHub',
  enabled() {
    return false;
  },
  async search() {
    return {
      provider: this.id,
      status: 'skipped',
      message: 'StubHub adapter placeholder. StubHub API access uses OAuth and may require partner approval. Wire approved credentials here before enabling.',
      listings: []
    };
  }
};
