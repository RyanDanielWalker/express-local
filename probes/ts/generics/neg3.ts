// Should fail: with NoInfer, T comes from options only, so 'md' is an error.
function pick<T extends string>(options: T[], initial: NoInfer<T>): T { return initial; }
pick(['sm', 'lg'], 'md');
