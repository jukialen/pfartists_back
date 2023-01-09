import { Prisma } from '@prisma/client';

export const stringToJsonForGet = async (orderBy?: string, where?: string) => {
  const orderArray: object[] = [];

  if (typeof orderBy === 'string') {
    const order = orderBy.split(', ');

    for (const or of order) {
      const data = or.replace(/(\w+:)|(\w+ :)/g, function (s) {
        return '"' + s.substring(0, s.length - 1) + '":';
      });

      const obj: Prisma.UsersOrderByWithRelationInput = await JSON.parse(data);

      orderArray.push(obj);
    }
  }

  let whereObj: string;
  if (typeof where === 'string') {
    const whereData = where.replace(/(\w+:)|(\w+ :)/g, function (s) {
      return '"' + s.substring(0, s.length - 1) + '":';
    });

    whereObj = await JSON.parse(whereData);
  }

  return {
    orderArray,
    whereObj,
  };
};
