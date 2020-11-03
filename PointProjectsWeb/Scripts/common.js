function formatDate(date, format)
{
    if (format == null)
        format = 'DD.MM.YYYY';
    return moment(date).format(format);
}