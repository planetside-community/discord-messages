export const getState = async <StateT>(path: string): Promise<StateT> => {
  const file = Bun.file(path);
  const state = await file.json<StateT>();
  return state;
};

export const writeState = async <StateT>(path: string, state: StateT) => {
  const file = Bun.file(path);

  await Bun.write(file, JSON.stringify(state, null, 2));
};
