export const formatDate = (date: Date) => {
    let formatDate = date.toLocaleString();
    let dateArr = date.toDateString().split(' ');

    let newDate =  dateArr[1] + ' ' + dateArr[2] + ', ' + dateArr[3];

    /* Make time prettier */
    if (formatDate.slice(-4) === "p.m.") {
        newDate = newDate.concat(" " + formatDate.slice(-13, -8) + " PM");
    } else {
        newDate = newDate.concat(" " + formatDate.slice(-13, -8) + " AM");
    }

    return newDate;
}