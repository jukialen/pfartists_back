import { stringToJsonForGet } from '../utilities/convertValues';

export const queriesTransformation = async (
  ifa: boolean,
  orderBy: string,
  where?: string,
) => {
  let order: unknown;
  let whereElements: unknown;

  if (typeof orderBy === 'string') {
    try {
      const { orderE } = await stringToJsonForGet(orderBy);
      order = orderE;
    } catch (e) {
      console.error(e);
    }
  }
  if (typeof where === 'string') {
    try {
      const { whereObj } = await stringToJsonForGet(where);
      whereElements = whereObj;
    } catch (e) {
      console.error(e);
    }
  }

  if (ifa) {
    return { order, whereElements };
  } else {
    return { order };
  }
};
