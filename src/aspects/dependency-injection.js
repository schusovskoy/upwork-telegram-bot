export const inject = ({ name, factory, singleton }) => func => ctx =>
  func({ ...ctx, [name]: factory ? factory() : singleton })
